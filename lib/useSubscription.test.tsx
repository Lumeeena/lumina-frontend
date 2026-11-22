// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { FakeSocket } from "./__fixtures__/fakeSocket";
import {
  LiveFeedNewTransactionDocument,
  type LiveFeedNewTransactionSubscription,
} from "./generated/graphql";
import { SubscriptionClient } from "./subscriptions";
import { __setSubscriptionClient, useSubscription } from "./useSubscription";

const SOCKET_URL = "ws://test/graphql";

interface PendingRetry {
  run: () => void;
  delay: number;
}

let sockets: FakeSocket[];
let pending: PendingRetry | null;
let client: SubscriptionClient;

beforeEach(() => {
  sockets = [];
  pending = null;
  client = new SubscriptionClient({
    url: SOCKET_URL,
    createSocket: (url) => {
      const socket = new FakeSocket(url);
      sockets.push(socket);
      return socket;
    },
    // Timers are captured rather than run, so each reconnect happens exactly
    // when the test says so.
    schedule: (run, delay) => {
      pending = { run, delay };
      return pending;
    },
    cancel: () => {
      pending = null;
    },
    // A jitter source of 1 removes the random reduction, so delays are exact.
    random: () => 1,
    retry: { baseDelayMs: 100, maxDelayMs: 1_000, maxAttempts: 3 },
  });
  __setSubscriptionClient(client);
});

afterEach(() => {
  cleanup();
  __setSubscriptionClient(null);
});

/** The newest socket, which is the one the client is currently using. */
function socket(): FakeSocket {
  return sockets[sockets.length - 1];
}

/**
 * The retry the client has scheduled. Read through a function so TypeScript
 * does not narrow the variable to `null` from its initial assignment.
 */
function scheduledRetry(): PendingRetry | null {
  return pending;
}

function runScheduledRetry(): void {
  const retry = scheduledRetry();
  if (!retry) throw new Error("no retry scheduled");
  pending = null;
  retry.run();
}

/** Open the socket and let the server acknowledge it. */
function bringUp(): void {
  act(() => socket().open());
  act(() => socket().ack());
}

function transaction(hash: string): LiveFeedNewTransactionSubscription {
  return {
    newTransaction: {
      hash,
      ledger: 1,
      createdAt: "2026-01-01T00:00:00Z",
      sourceAccount: "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
      feeCharged: "100",
      operationCount: 1,
      successful: true,
      memoType: null,
      memo: null,
    },
  };
}

describe("useSubscription", () => {
  it("opens a socket on mount and reports connecting until the server acknowledges", () => {
    const { result } = renderHook(() =>
      useSubscription(LiveFeedNewTransactionDocument, undefined),
    );

    expect(sockets).toHaveLength(1);
    expect(sockets[0].url).toBe(SOCKET_URL);
    expect(result.current.state).toBe("connecting");

    act(() => socket().open());
    expect(socket().framesOfType("connection_init")).toHaveLength(1);
    expect(result.current.state).toBe("connecting");

    act(() => socket().ack());
    expect(result.current.state).toBe("connected");
  });

  it("subscribes only once the connection is acknowledged", () => {
    renderHook(() => useSubscription(LiveFeedNewTransactionDocument, undefined));

    act(() => socket().open());
    expect(socket().framesOfType("subscribe")).toHaveLength(0);

    act(() => socket().ack());
    const [subscribe] = socket().framesOfType("subscribe");
    expect(subscribe.id).toBe("1");
    expect(JSON.stringify(subscribe.payload)).toContain("LiveFeedNewTransaction");
  });

  it("exposes each payload as the latest value and passes it to onData", () => {
    const onData = vi.fn();
    const { result } = renderHook(() =>
      useSubscription(LiveFeedNewTransactionDocument, undefined, onData),
    );
    bringUp();

    act(() =>
      socket().deliver({ type: "next", id: "1", payload: { data: transaction("first") } }),
    );
    expect(result.current.latest).toEqual(transaction("first"));

    act(() =>
      socket().deliver({ type: "next", id: "1", payload: { data: transaction("second") } }),
    );
    expect(result.current.latest).toEqual(transaction("second"));
    expect(onData.mock.calls).toEqual([[transaction("first")], [transaction("second")]]);
  });

  it("reconnects after a drop and subscribes again on the new socket", () => {
    const { result } = renderHook(() =>
      useSubscription(LiveFeedNewTransactionDocument, undefined),
    );
    bringUp();

    act(() => socket().drop(1006));
    expect(result.current.state).toBe("reconnecting");
    // The first retry waits the base delay, with no jitter reduction.
    expect(scheduledRetry()?.delay).toBe(100);

    act(() => runScheduledRetry());
    expect(sockets).toHaveLength(2);

    act(() => socket().open());
    act(() => socket().ack());
    expect(result.current.state).toBe("connected");
    // The server has no memory of the old socket, so the subscription is replayed.
    expect(socket().framesOfType("subscribe")).toHaveLength(1);
  });

  it("sends complete and closes the socket when the component unmounts", () => {
    const { unmount } = renderHook(() =>
      useSubscription(LiveFeedNewTransactionDocument, undefined),
    );
    bringUp();
    const live = socket();

    unmount();

    expect(live.framesOfType("complete").map((frame) => frame.id)).toEqual(["1"]);
    expect(live.closed).toBe(true);
    expect(client.getState()).toBe("idle");
  });

  it("cancels a scheduled reconnect on unmount, so no socket opens afterwards", () => {
    const { unmount } = renderHook(() =>
      useSubscription(LiveFeedNewTransactionDocument, undefined),
    );
    bringUp();
    act(() => socket().drop(1006));
    expect(scheduledRetry()).not.toBeNull();

    unmount();

    expect(scheduledRetry()).toBeNull();
    expect(sockets).toHaveLength(1);
  });
});
