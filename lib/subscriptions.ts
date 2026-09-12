// A GraphQL-over-WebSocket client speaking the `graphql-transport-ws` protocol
// — the same wire format `graphql-ws` servers (and Apollo Server's subscription
// support) implement, so this interoperates with the backend's `Subscription`
// type without pulling the library into the client bundle.
//
// Hand-rolling the protocol rather than depending on `graphql-ws` buys the two
// things this module exists for: an explicit, observable connection state the
// UI can render, and reconnection the caller can give up on so `LiveFeed` knows
// when to fall back to polling. `graphql-ws` owns its own retry loop and
// reports far less about what it is doing.
//
// The module is deliberately free of React and of any direct reference to
// globals, so its whole lifecycle — backoff, re-subscription, giving up — is
// testable in a plain node environment with a fake socket.

/** The parts of `WebSocket` this client uses. */
export interface WebSocketLike {
  readonly readyState: number;
  send(data: string): void;
  close(code?: number, reason?: string): void;
  onopen: (() => void) | null;
  onclose: (() => void) | null;
  onerror: (() => void) | null;
  onmessage: ((event: { data: unknown }) => void) | null;
}

export type ConnectionState =
  /** No subscriber yet, so no socket has been opened. */
  | "idle"
  /** First connection attempt in flight. */
  | "connecting"
  /** Connected and acknowledged; messages are flowing. */
  | "connected"
  /** Dropped, retrying with backoff. Data is stale but recovery is expected. */
  | "reconnecting"
  /** Gave up after exhausting retries — the caller should fall back. */
  | "disconnected"
  /** No WebSocket in this environment at all; fall back immediately. */
  | "unsupported";

export interface SubscriptionHandlers<T> {
  onData: (data: T) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

export interface RetryPolicy {
  /** Delay before the first retry, doubled each attempt. */
  baseDelayMs: number;
  /** Ceiling for the doubling, so a long outage retries at a steady rate. */
  maxDelayMs: number;
  /** Consecutive failures before the client gives up and reports `disconnected`. */
  maxAttempts: number;
}

export const DEFAULT_RETRY: RetryPolicy = {
  baseDelayMs: 1_000,
  maxDelayMs: 30_000,
  maxAttempts: 8,
};

export interface SubscriptionClientOptions {
  url: string;
  /** Injectable for tests; defaults to the platform `WebSocket`. */
  createSocket?: (url: string) => WebSocketLike;
  retry?: Partial<RetryPolicy>;
  /** Injectable timers, so tests drive backoff without real delays. */
  schedule?: (run: () => void, delayMs: number) => unknown;
  cancel?: (handle: unknown) => void;
  /** Injectable jitter source; must return [0, 1). */
  random?: () => number;
}

interface ActiveSubscription {
  id: string;
  payload: { query: string; variables?: Record<string, unknown> };
  handlers: SubscriptionHandlers<unknown>;
  /** Whether the current socket has been told about this subscription. */
  sent: boolean;
}

const WS_SUBPROTOCOL = "graphql-transport-ws";
const OPEN = 1;

/**
 * Turn an HTTP GraphQL endpoint into its WebSocket equivalent.
 *
 * Deployments almost always serve subscriptions from the same origin and path
 * as queries, so deriving the default saves operators from configuring a second
 * URL that has to be kept in sync with the first.
 */
export function deriveWebSocketUrl(httpUrl: string): string {
  if (httpUrl.startsWith("https://")) return `wss://${httpUrl.slice("https://".length)}`;
  if (httpUrl.startsWith("http://")) return `ws://${httpUrl.slice("http://".length)}`;
  return httpUrl;
}

export class SubscriptionClient {
  private readonly url: string;
  private readonly createSocket: (url: string) => WebSocketLike;
  private readonly retry: RetryPolicy;
  private readonly schedule: (run: () => void, delayMs: number) => unknown;
  private readonly cancel: (handle: unknown) => void;
  private readonly random: () => number;

  private socket: WebSocketLike | null = null;
  private acknowledged = false;
  private state: ConnectionState = "idle";
  private attempts = 0;
  private retryHandle: unknown = null;
  private disposed = false;
  private nextId = 1;

  private readonly subscriptions = new Map<string, ActiveSubscription>();
  private readonly stateListeners = new Set<(state: ConnectionState) => void>();
  private readonly injectedFactory: boolean;

  constructor(options: SubscriptionClientOptions) {
    this.url = options.url;
    this.injectedFactory = options.createSocket !== undefined;
    this.retry = { ...DEFAULT_RETRY, ...options.retry };
    this.schedule = options.schedule ?? ((run, delayMs) => setTimeout(run, delayMs));
    this.cancel = options.cancel ?? (handle => clearTimeout(handle as ReturnType<typeof setTimeout>));
    this.random = options.random ?? Math.random;
    this.createSocket =
      options.createSocket ??
      (url => new WebSocket(url, WS_SUBPROTOCOL) as unknown as WebSocketLike);
  }

  getState(): ConnectionState {
    return this.state;
  }

  /** Subscribe to state changes. Returns an unsubscribe function. */
  onStateChange(listener: (state: ConnectionState) => void): () => void {
    this.stateListeners.add(listener);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  /**
   * Start a subscription, opening the connection if this is the first one.
   * Returns a function that stops it.
   */
  subscribe<T>(
    query: string,
    variables: Record<string, unknown> | undefined,
    handlers: SubscriptionHandlers<T>,
  ): () => void {
    if (this.disposed) return () => {};

    const id = String(this.nextId++);
    const entry: ActiveSubscription = {
      id,
      payload: { query, variables },
      handlers: handlers as SubscriptionHandlers<unknown>,
      sent: false,
    };
    this.subscriptions.set(id, entry);

    if (this.state === "connected") {
      this.sendSubscribe(entry);
    } else {
      this.connect();
    }

    return () => this.stop(id);
  }

  /** Tear everything down. The client is not reusable afterwards. */
  dispose(): void {
    this.disposed = true;
    this.clearRetry();
    this.subscriptions.clear();
    this.closeSocket();
    this.setState("disconnected");
    this.stateListeners.clear();
  }

  // ── Connection lifecycle ────────────────────────────────────────────────

  private connect(): void {
    if (this.disposed || this.socket) return;

    // A server-rendered pass, or a browser old enough to lack WebSocket, gets
    // a definitive answer rather than a stuck "connecting".
    if (!this.hasWebSocket()) {
      this.setState("unsupported");
      return;
    }

    this.setState(this.attempts === 0 ? "connecting" : "reconnecting");
    this.acknowledged = false;

    let socket: WebSocketLike;
    try {
      socket = this.createSocket(this.url);
    } catch {
      // Construction itself can throw on a malformed URL or a blocked scheme.
      this.scheduleReconnect();
      return;
    }

    this.socket = socket;
    socket.onopen = () => this.handleOpen();
    socket.onmessage = event => this.handleMessage(event.data);
    socket.onerror = () => {
      // `onclose` always follows `onerror`, so recovery is driven from there
      // and this handler only exists to stop the event surfacing as unhandled.
    };
    socket.onclose = () => this.handleClose();
  }

  private handleOpen(): void {
    this.send({ type: "connection_init" });
  }

  private handleAck(): void {
    this.acknowledged = true;
    this.attempts = 0;
    this.setState("connected");
    // Replay everything still active — after a reconnect the server has no
    // memory of subscriptions opened on the previous socket.
    for (const entry of this.subscriptions.values()) {
      entry.sent = false;
      this.sendSubscribe(entry);
    }
  }

  private handleClose(): void {
    this.socket = null;
    this.acknowledged = false;
    for (const entry of this.subscriptions.values()) {
      entry.sent = false;
    }
    if (this.disposed) return;
    // Nothing left to keep a connection open for.
    if (this.subscriptions.size === 0) {
      this.setState("idle");
      return;
    }
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    this.socket = null;

    if (this.attempts >= this.retry.maxAttempts) {
      // Report the failure rather than retrying forever in the background —
      // the caller needs to know it should fall back.
      this.setState("disconnected");
      return;
    }

    const delay = this.backoffDelay(this.attempts);
    this.attempts += 1;
    this.setState("reconnecting");
    this.retryHandle = this.schedule(() => {
      this.retryHandle = null;
      this.connect();
    }, delay);
  }

  /**
   * Exponential backoff capped at `maxDelayMs`, with full jitter.
   *
   * The jitter matters more than the growth: without it every tab watching the
   * feed reconnects on the same schedule and hammers the server in lockstep
   * the moment it comes back.
   */
  private backoffDelay(attempt: number): number {
    const exponential = Math.min(this.retry.baseDelayMs * 2 ** attempt, this.retry.maxDelayMs);
    return Math.round(exponential * (0.5 + this.random() * 0.5));
  }

  private clearRetry(): void {
    if (this.retryHandle !== null) {
      this.cancel(this.retryHandle);
      this.retryHandle = null;
    }
  }

  private closeSocket(): void {
    const socket = this.socket;
    this.socket = null;
    if (!socket) return;
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;
    try {
      socket.close();
    } catch {
      // A socket that is already closing throws in some implementations.
    }
  }

  // ── Protocol ────────────────────────────────────────────────────────────

  private handleMessage(raw: unknown): void {
    let message: { type?: string; id?: string; payload?: unknown };
    try {
      message = typeof raw === "string" ? JSON.parse(raw) : (raw as typeof message);
    } catch {
      return; // Ignore frames we cannot parse rather than tearing down.
    }
    if (!message || typeof message.type !== "string") return;

    switch (message.type) {
      case "connection_ack":
        this.handleAck();
        break;

      case "ping":
        this.send({ type: "pong" });
        break;

      case "next": {
        const entry = message.id ? this.subscriptions.get(message.id) : undefined;
        if (!entry) return;
        const payload = message.payload as { data?: unknown; errors?: { message: string }[] };
        if (payload?.errors?.length) {
          entry.handlers.onError?.(new Error(payload.errors.map(e => e.message).join("; ")));
          return;
        }
        if (payload?.data !== undefined && payload.data !== null) {
          entry.handlers.onData(payload.data);
        }
        break;
      }

      case "error": {
        const entry = message.id ? this.subscriptions.get(message.id) : undefined;
        if (!entry) return;
        const errors = message.payload as { message: string }[] | undefined;
        const text = Array.isArray(errors) && errors.length
          ? errors.map(e => e.message).join("; ")
          : "Subscription failed";
        entry.handlers.onError?.(new Error(text));
        // A subscription the server rejected will not recover by being
        // replayed, so drop it rather than re-sending it on every reconnect.
        this.subscriptions.delete(entry.id);
        break;
      }

      case "complete": {
        const entry = message.id ? this.subscriptions.get(message.id) : undefined;
        if (!entry) return;
        entry.handlers.onComplete?.();
        this.subscriptions.delete(entry.id);
        break;
      }
    }
  }

  private sendSubscribe(entry: ActiveSubscription): void {
    if (entry.sent) return;
    const delivered = this.send({ type: "subscribe", id: entry.id, payload: entry.payload });
    entry.sent = delivered;
  }

  private stop(id: string): void {
    const entry = this.subscriptions.get(id);
    if (!entry) return;
    this.subscriptions.delete(id);
    if (entry.sent) {
      this.send({ type: "complete", id });
    }
    // Last subscriber out closes the connection rather than leaving a socket
    // open on a page the user has navigated away from.
    if (this.subscriptions.size === 0) {
      this.clearRetry();
      this.closeSocket();
      this.attempts = 0;
      if (!this.disposed) this.setState("idle");
    }
  }

  /** Returns whether the frame actually went out. */
  private send(message: Record<string, unknown>): boolean {
    const socket = this.socket;
    if (!socket || socket.readyState !== OPEN) return false;
    // `connection_init` is the one frame allowed before the ack.
    if (!this.acknowledged && message.type !== "connection_init" && message.type !== "pong") {
      return false;
    }
    try {
      socket.send(JSON.stringify(message));
      return true;
    } catch {
      return false;
    }
  }

  private setState(state: ConnectionState): void {
    if (this.state === state) return;
    this.state = state;
    for (const listener of this.stateListeners) listener(state);
  }

  /**
   * A caller that supplied its own socket factory has taken responsibility for
   * producing a socket, so the platform global is irrelevant to them. Everyone
   * else needs a real `WebSocket` — on a server-rendered pass there is none,
   * and reporting that immediately is what lets the UI fall back instead of
   * sitting on a "connecting" spinner forever.
   */
  private hasWebSocket(): boolean {
    return this.injectedFactory || typeof WebSocket !== "undefined";
  }
}
