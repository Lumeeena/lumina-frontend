import type { WebSocketLike } from "../subscriptions";

/**
 * A socket the test drives by hand.
 *
 * Nothing here is asynchronous, so every assertion is about a state the client
 * reached deterministically rather than one it happened to reach in time.
 */
export class FakeSocket implements WebSocketLike {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 3;

  readyState = FakeSocket.CONNECTING;
  readonly sent: string[] = [];
  closed = false;

  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;

  constructor(readonly url: string) {}

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.closed = true;
    this.readyState = FakeSocket.CLOSED;
  }

  // ── Test drivers ────────────────────────────────────────────────────────

  open(): void {
    this.readyState = FakeSocket.OPEN;
    this.onopen?.();
  }

  ack(): void {
    this.deliver({ type: "connection_ack" });
  }

  deliver(message: unknown): void {
    this.onmessage?.({ data: JSON.stringify(message) });
  }

  drop(): void {
    this.readyState = FakeSocket.CLOSED;
    this.onclose?.();
  }

  /** Frames the client sent, parsed. */
  frames(): { type: string; id?: string; payload?: unknown }[] {
    return this.sent.map(raw => JSON.parse(raw));
  }

  framesOfType(type: string) {
    return this.frames().filter(frame => frame.type === type);
  }
}
