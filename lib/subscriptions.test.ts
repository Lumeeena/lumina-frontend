import { describe, expect, it } from "vitest";
import {
  SubscriptionClient,
  deriveWebSocketUrl,
  type ConnectionState,
} from "./subscriptions";
import { FakeSocket } from "./__fixtures__/fakeSocket";

interface Harness {
  client: SubscriptionClient;
  sockets: FakeSocket[];
  states: ConnectionState[];
  /** Run the pending reconnect timer, returning the delay it was scheduled at. */
  runPendingRetry: () => number;
  pendingDelay: () => number | null;
}

function harness(retry?: { baseDelayMs?: number; maxDelayMs?: number; maxAttempts?: number }): Harness {
  const sockets: FakeSocket[] = [];
  const states: ConnectionState[] = [];
  let pending: { run: () => void; delay: number } | null = null;

  const client = new SubscriptionClient({
    url: "ws://test/graphql",
    createSocket: url => {
      const socket = new FakeSocket(url);
      sockets.push(socket);
      return socket;
    },
    schedule: (run, delay) => {
      pending = { run, delay };
      return pending;
    },
    cancel: () => {
      pending = null;
    },
    // Fixed jitter so backoff assertions are exact; the jitter factor is
    // `0.5 + random * 0.5`, so 1 means "no reduction".
    random: () => 1,
    retry: { baseDelayMs: 100, maxDelayMs: 1_000, maxAttempts: 3, ...retry },
  });

  client.onStateChange(state => states.push(state));

  return {
    client,
    sockets,
    states,
    pendingDelay: () => pending?.delay ?? null,
    runPendingRetry: () => {
      if (!pending) throw new Error("no retry scheduled");
      const { run, delay } = pending;
      pending = null;
      run();
      return delay;
    },
  };
}

/** Subscribe, then bring the newest socket all the way up. */
function connect(h: Harness, onData: (data: unknown) => void = () => {}) {
  const stop = h.client.subscribe("subscription S { x }", undefined, { onData });
  const socket = h.sockets[h.sockets.length - 1];
  socket.open();
  socket.ack();
  return { stop, socket };
}

describe("deriveWebSocketUrl", () => {
  it("swaps http for ws and https for wss", () => {
    expect(deriveWebSocketUrl("http://localhost:4000/graphql")).toBe("ws://localhost:4000/graphql");
    expect(deriveWebSocketUrl("https://api.example.com/graphql")).toBe("wss://api.example.com/graphql");
  });

  it("leaves an already-websocket url alone", () => {
    expect(deriveWebSocketUrl("wss://api.example.com/graphql")).toBe("wss://api.example.com/graphql");
  });
});

describe("SubscriptionClient connection lifecycle", () => {
  it("stays idle until something subscribes", () => {
    const h = harness();
    expect(h.client.getState()).toBe("idle");
    expect(h.sockets).toHaveLength(0);
  });

  it("opens a socket and initiates the handshake on the first subscribe", () => {
    const h = harness();
    h.client.subscribe("subscription S { x }", undefined, { onData: () => {} });

    expect(h.sockets).toHaveLength(1);
    expect(h.client.getState()).toBe("connecting");

    h.sockets[0].open();
    expect(h.sockets[0].framesOfType("connection_init")).toHaveLength(1);
  });

  it("reports connected only after the server acknowledges", () => {
    const h = harness();
    h.client.subscribe("subscription S { x }", undefined, { onData: () => {} });
    h.sockets[0].open();

    // Open is not the same as usable — the handshake has not completed.
    expect(h.client.getState()).toBe("connecting");

    h.sockets[0].ack();
    expect(h.client.getState()).toBe("connected");
  });

  it("sends the subscribe frame with its query and variables", () => {
    const h = harness();
    h.client.subscribe("subscription S($a: String!) { x(a: $a) }", { a: "hello" }, { onData: () => {} });
    h.sockets[0].open();
    h.sockets[0].ack();

    const [frame] = h.sockets[0].framesOfType("subscribe");
    expect(frame.id).toBe("1");
    expect(frame.payload).toEqual({
      query: "subscription S($a: String!) { x(a: $a) }",
      variables: { a: "hello" },
    });
  });

  it("answers a server ping with a pong", () => {
    const h = harness();
    const { socket } = connect(h);
    socket.deliver({ type: "ping" });

    expect(socket.framesOfType("pong")).toHaveLength(1);
  });

  it("reports unsupported when there is no WebSocket and no injected factory", () => {
    const client = new SubscriptionClient({ url: "ws://test/graphql" });
    const states: ConnectionState[] = [];
    client.onStateChange(s => states.push(s));

    client.subscribe("subscription S { x }", undefined, { onData: () => {} });

    // This suite runs in node, where `WebSocket` may or may not be global
    // depending on the runtime — assert the two acceptable outcomes rather
    // than pinning one.
    expect(["unsupported", "connecting"]).toContain(client.getState());
    client.dispose();
  });
});

describe("SubscriptionClient message routing", () => {
  it("delivers next payloads to the right subscription", () => {
    const h = harness();
    const first: unknown[] = [];
    const second: unknown[] = [];

    h.client.subscribe("subscription A { a }", undefined, { onData: d => first.push(d) });
    h.client.subscribe("subscription B { b }", undefined, { onData: d => second.push(d) });
    h.sockets[0].open();
    h.sockets[0].ack();

    h.sockets[0].deliver({ id: "1", type: "next", payload: { data: { a: 1 } } });
    h.sockets[0].deliver({ id: "2", type: "next", payload: { data: { b: 2 } } });

    expect(first).toEqual([{ a: 1 }]);
    expect(second).toEqual([{ b: 2 }]);
  });

  it("routes GraphQL errors inside a next payload to onError", () => {
    const h = harness();
    const errors: string[] = [];
    h.client.subscribe("subscription S { x }", undefined, {
      onData: () => {},
      onError: e => errors.push(e.message),
    });
    h.sockets[0].open();
    h.sockets[0].ack();

    h.sockets[0].deliver({ id: "1", type: "next", payload: { errors: [{ message: "boom" }] } });

    expect(errors).toEqual(["boom"]);
  });

  it("drops a subscription the server rejected instead of replaying it forever", () => {
    const h = harness();
    const errors: string[] = [];
    h.client.subscribe("subscription S { bad }", undefined, {
      onData: () => {},
      onError: e => errors.push(e.message),
    });
    h.sockets[0].open();
    h.sockets[0].ack();
    h.sockets[0].deliver({ id: "1", type: "error", payload: [{ message: "unknown field" }] });

    expect(errors).toEqual(["unknown field"]);

    // Reconnecting must not re-send an operation the server already refused.
    h.sockets[0].drop();
    expect(h.client.getState()).toBe("idle");
    expect(h.sockets).toHaveLength(1);
  });

  it("completes and forgets a subscription the server finished", () => {
    const h = harness();
    let completed = false;
    h.client.subscribe("subscription S { x }", undefined, {
      onData: () => {},
      onComplete: () => {
        completed = true;
      },
    });
    h.sockets[0].open();
    h.sockets[0].ack();
    h.sockets[0].deliver({ id: "1", type: "complete" });

    expect(completed).toBe(true);
  });

  it("ignores unparseable frames rather than tearing down", () => {
    const h = harness();
    const { socket } = connect(h);
    socket.onmessage?.({ data: "not json at all" });

    expect(h.client.getState()).toBe("connected");
  });

  it("ignores messages for an unknown subscription id", () => {
    const h = harness();
    const received: unknown[] = [];
    connect(h, d => received.push(d));
    h.sockets[0].deliver({ id: "999", type: "next", payload: { data: { x: 1 } } });

    expect(received).toEqual([]);
  });
});

describe("SubscriptionClient unsubscribe", () => {
  it("tells the server to stop and closes the socket when the last one goes", () => {
    const h = harness();
    const { stop, socket } = connect(h);

    stop();

    expect(socket.framesOfType("complete")).toHaveLength(1);
    expect(socket.closed).toBe(true);
    expect(h.client.getState()).toBe("idle");
  });

  it("keeps the connection while another subscription is still active", () => {
    const h = harness();
    const stopA = h.client.subscribe("subscription A { a }", undefined, { onData: () => {} });
    h.client.subscribe("subscription B { b }", undefined, { onData: () => {} });
    h.sockets[0].open();
    h.sockets[0].ack();

    stopA();

    expect(h.sockets[0].closed).toBe(false);
    expect(h.client.getState()).toBe("connected");
  });

  it("stops delivering to a cancelled subscription", () => {
    const h = harness();
    const received: unknown[] = [];
    h.client.subscribe("subscription A { a }", undefined, { onData: d => received.push(d) });
    h.client.subscribe("subscription B { b }", undefined, { onData: () => {} });
    h.sockets[0].open();
    h.sockets[0].ack();

    const stopA = h.client.subscribe("subscription C { c }", undefined, { onData: d => received.push(d) });
    stopA();
    h.sockets[0].deliver({ id: "3", type: "next", payload: { data: { c: 3 } } });

    expect(received).toEqual([]);
  });
});

describe("SubscriptionClient reconnection", () => {
  it("goes to reconnecting and schedules a retry when the socket drops", () => {
    const h = harness();
    connect(h);

    h.sockets[0].drop();

    expect(h.client.getState()).toBe("reconnecting");
    expect(h.pendingDelay()).toBe(100);
  });

  it("replays active subscriptions on the new connection", () => {
    const h = harness();
    connect(h);
    h.sockets[0].drop();
    h.runPendingRetry();

    const reconnected = h.sockets[1];
    reconnected.open();
    reconnected.ack();

    // The server has no memory of the previous socket's subscriptions, so the
    // client has to re-open them or the feed silently stays empty.
    expect(reconnected.framesOfType("subscribe")).toHaveLength(1);
    expect(reconnected.framesOfType("subscribe")[0].id).toBe("1");
    expect(h.client.getState()).toBe("connected");
  });

  it("keeps delivering data after a reconnect", () => {
    const h = harness();
    const received: unknown[] = [];
    connect(h, d => received.push(d));

    h.sockets[0].drop();
    h.runPendingRetry();
    h.sockets[1].open();
    h.sockets[1].ack();
    h.sockets[1].deliver({ id: "1", type: "next", payload: { data: { x: 1 } } });

    expect(received).toEqual([{ x: 1 }]);
  });

  it("backs off exponentially, capped at maxDelayMs", () => {
    const h = harness({ maxAttempts: 10 });
    connect(h);

    const delays: number[] = [];
    for (let i = 0; i < 5; i++) {
      h.sockets[h.sockets.length - 1].drop();
      delays.push(h.pendingDelay()!);
      h.runPendingRetry();
    }

    // 100, 200, 400, 800, then capped at 1000.
    expect(delays).toEqual([100, 200, 400, 800, 1000]);
  });

  it("gives up after maxAttempts so the caller can fall back", () => {
    const h = harness({ maxAttempts: 2 });
    connect(h);

    h.sockets[0].drop();
    h.runPendingRetry();
    h.sockets[1].drop();
    h.runPendingRetry();
    h.sockets[2].drop();

    expect(h.client.getState()).toBe("disconnected");
    expect(h.pendingDelay()).toBeNull();
  });

  it("resets the attempt budget once a connection succeeds", () => {
    const h = harness({ maxAttempts: 2 });
    connect(h);

    h.sockets[0].drop();
    h.runPendingRetry();
    h.sockets[1].open();
    h.sockets[1].ack();

    // A later outage gets the full budget again, and starts from the base
    // delay rather than continuing to grow from the earlier one.
    h.sockets[1].drop();
    expect(h.client.getState()).toBe("reconnecting");
    expect(h.pendingDelay()).toBe(100);
  });

  it("does not leave the UI showing a stale connected state after a drop", () => {
    const h = harness();
    connect(h);
    expect(h.client.getState()).toBe("connected");

    h.sockets[0].drop();

    expect(h.client.getState()).not.toBe("connected");
    expect(h.states).toContain("reconnecting");
  });

  it("does not reconnect for a subscription that was already cancelled", () => {
    const h = harness();
    const { stop, socket } = connect(h);
    stop();
    socket.drop();

    expect(h.pendingDelay()).toBeNull();
    expect(h.sockets).toHaveLength(1);
  });
});

describe("SubscriptionClient dispose", () => {
  it("closes the socket and refuses further subscriptions", () => {
    const h = harness();
    const { socket } = connect(h);

    h.client.dispose();

    expect(socket.closed).toBe(true);
    expect(h.client.getState()).toBe("disconnected");

    const received: unknown[] = [];
    h.client.subscribe("subscription S { x }", undefined, { onData: d => received.push(d) });
    expect(h.sockets).toHaveLength(1);
    expect(received).toEqual([]);
  });
});
