// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { FakeSocket } from "./__fixtures__/fakeSocket";
import { SubscriptionClient } from "./subscriptions";
import { __setSubscriptionClient } from "./useSubscription";
import { MAX_ACTIVITY_LENGTH, useWatchedActivity } from "./useWatchedActivity";
import { WATCHES_STORAGE_KEY } from "./watches";
import { DEFAULT_OPERATION_FILTERS, EMPTY_OPERATION_FILTERS } from "./operationFilters";
import type { Operation } from "./types";

let socket: FakeSocket;
let client: SubscriptionClient;

function install() {
  socket = new FakeSocket("ws://test/graphql");
  client = new SubscriptionClient({
    url: "ws://test/graphql",
    createSocket: () => socket,
    schedule: () => 0,
    cancel: () => {},
  });
  __setSubscriptionClient(client);
}

/**
 * Write the watch list and announce it, which is what `addWatch`/`removeWatch`
 * in `lib/watches.ts` do on a write. Writing storage alone would not be
 * equivalent: the hook listens for the event, not for the key.
 */
function watch(
  addresses: string[],
  filters = DEFAULT_OPERATION_FILTERS,
) {
  localStorage.setItem(
    WATCHES_STORAGE_KEY,
    JSON.stringify(addresses.map((address) => ({ address, filters }))),
  );
  window.dispatchEvent(new CustomEvent("lumina:watches"));
}

function op(overrides: Partial<Operation> = {}): Operation {
  return {
    id: "op-1",
    type: "PAYMENT",
    createdAt: "2026-03-01T12:00:00Z",
    transactionHash: "b".repeat(64),
    sourceAccount: "GA",
    from: "GA",
    to: "GB",
    amount: "100",
    asset: null,
    ...overrides,
  } as Operation;
}

/** Deliver a payload on the `subscribe` frame whose variables carry `address`. */
function deliverFor(address: string, operation: Operation) {
  const frame = socket
    .framesOfType("subscribe")
    .find((candidate) => (candidate.payload as { variables?: { address?: string } })?.variables?.address === address);
  if (!frame) throw new Error(`no subscription for ${address}`);
  socket.deliver({
    id: frame.id,
    type: "next",
    payload: { data: { accountActivity: operation } },
  });
}

/** Renders the hook and exposes its latest result. */
function mount(onAlert?: (activity: { id: string }) => void) {
  const seen: unknown[] = [];
  function Probe() {
    seen.push(useWatchedActivity(onAlert));
    return null;
  }
  render(<Probe />);
  return { latest: () => seen[seen.length - 1] as ReturnType<typeof useWatchedActivity>, renders: seen };
}

beforeEach(() => {
  localStorage.clear();
  install();
});

afterEach(() => {
  cleanup();
  __setSubscriptionClient(null);
});

describe("useWatchedActivity", () => {
  it("opens no subscription at all for an empty watch list", () => {
    watch([]);
    const { latest } = mount();

    expect(latest().watching).toBe(0);
    expect(client.getState()).toBe("idle");
  });

  it("shows activity from every watched address in one feed", () => {
    // The acceptance criterion for #80: one feed, not one per watch.
    watch(["GA", "GB", "GC"]);
    const { latest } = mount();

    act(() => {
      socket.open();
      socket.ack();
    });
    act(() => deliverFor("GA", op({ id: "a1" })));
    act(() => deliverFor("GB", op({ id: "b1", sourceAccount: "GB" })));
    act(() => deliverFor("GC", op({ id: "c1", sourceAccount: "GC" })));

    expect(latest().activity.map((item) => item.address)).toEqual(["GC", "GB", "GA"]);
  });

  it("does not grow the connection count with the watch list", () => {
    // The failure this issue is named after: one socket per watched address.
    watch(["GA", "GB", "GC", "GD", "GE", "GF", "GG", "GH"]);
    mount();

    act(() => {
      socket.open();
      socket.ack();
    });

    expect(socket.framesOfType("subscribe")).toHaveLength(8);
    // One `connection_init` and one `connection_ack` for the lot: a single
    // multiplexed connection carrying every subscription.
    expect(socket.framesOfType("connection_init")).toHaveLength(1);
    expect(client.getState()).toBe("connected");
  });

  it("does not open a second socket when a watch is added later", () => {
    watch(["GA"]);
    mount();
    act(() => {
      socket.open();
      socket.ack();
    });
    const firstSocket = socket;

    act(() => watch(["GA", "GB"]));

    expect(socket).toBe(firstSocket);
    expect(socket.framesOfType("subscribe")).toHaveLength(2);
  });

  it("deduplicates a replayed operation", () => {
    // The server replays every active subscription after a reconnect, so a
    // duplicate is the normal case, not an edge case.
    watch(["GA"]);
    const { latest } = mount();
    act(() => {
      socket.open();
      socket.ack();
    });

    act(() => deliverFor("GA", op({ id: "dup" })));
    act(() => deliverFor("GA", op({ id: "dup" })));

    expect(latest().activity).toHaveLength(1);
  });

  it("caps the feed", () => {
    watch(["GA"]);
    const { latest } = mount();
    act(() => {
      socket.open();
      socket.ack();
    });

    act(() => {
      for (let i = 0; i < MAX_ACTIVITY_LENGTH + 10; i++) {
        deliverFor("GA", op({ id: `op-${i}` }));
      }
    });

    expect(latest().activity).toHaveLength(MAX_ACTIVITY_LENGTH);
  });

  it("drops an operation that does not involve the watched address", () => {
    // The server filters by address, but the feed is labelled as being about
    // this address; showing a stranger's operation would make the label wrong.
    watch(["GA"]);
    const { latest } = mount();
    act(() => {
      socket.open();
      socket.ack();
    });

    act(() => deliverFor("GA", op({ id: "other", sourceAccount: "GZ", from: "GZ", to: "GZ" })));

    expect(latest().activity).toHaveLength(0);
  });

  it("raises an alert only for operations the watch's filters allow", () => {
    // #83: the feed shows everything, the alert only shows what was configured.
    watch(["GA"], { ...DEFAULT_OPERATION_FILTERS, minAmount: 1000 });
    const onAlert = vi.fn();
    const { latest } = mount(onAlert);
    act(() => {
      socket.open();
      socket.ack();
    });

    act(() => deliverFor("GA", op({ id: "small", amount: "1" })));
    act(() => deliverFor("GA", op({ id: "big", amount: "5000" })));

    expect(latest().activity).toHaveLength(2);
    expect(latest().alertCount).toBe(1);
    expect(onAlert).toHaveBeenCalledTimes(1);
    expect(onAlert.mock.calls[0][0].id).toBe("GA:big");
  });

  it("raises an alert for everything when the watch has no filters", () => {
    watch(["GA"], EMPTY_OPERATION_FILTERS);
    const onAlert = vi.fn();
    mount(onAlert);
    act(() => {
      socket.open();
      socket.ack();
    });

    act(() => deliverFor("GA", op({ id: "a", type: "SET_OPTIONS" })));
    act(() => deliverFor("GA", op({ id: "b", type: "MANAGE_DATA", amount: null })));

    expect(onAlert).toHaveBeenCalledTimes(2);
  });

  it("applies a filter change without resubscribing", () => {
    // Filters are read at delivery time on purpose: they do not appear on the
    // wire, so tightening one should not cost a reconnect. This is the test
    // that fails if the address→filters map is captured when the subscription
    // opens instead of being refreshed.
    watch(["GA"], { ...DEFAULT_OPERATION_FILTERS, minAmount: 1000 });
    const onAlert = vi.fn();
    mount(onAlert);
    act(() => {
      socket.open();
      socket.ack();
    });

    const subscribes = () => socket.framesOfType("subscribe").length;
    const before = subscribes();

    // Loosen the filter to everything.
    act(() => watch(["GA"], EMPTY_OPERATION_FILTERS));
    act(() => deliverFor("GA", op({ id: "set-options", type: "SET_OPTIONS" })));

    expect(onAlert).toHaveBeenCalledTimes(1);
    // The point: the new filter took effect without a second `subscribe` frame.
    expect(subscribes()).toBe(before);

    // And tightening it again is honoured as well.
    act(() => watch(["GA"], DEFAULT_OPERATION_FILTERS));
    act(() => deliverFor("GA", op({ id: "contract", type: "CREATE_CONTRACT" })));
    expect(onAlert).toHaveBeenCalledTimes(1);
    expect(subscribes()).toBe(before);
  });

  it("does not restart the subscriptions when an unrelated watch event fires", () => {
    // A rewrite of the same list from another tab must not tear the socket down
    // and open a new one.
    watch(["GA", "GB"]);
    mount();
    act(() => {
      socket.open();
      socket.ack();
    });
    const before = socket.framesOfType("subscribe").length;

    act(() => {
      watch(["GA", "GB"]);
    });

    expect(socket.framesOfType("subscribe")).toHaveLength(before);
  });

  it("picks up a watch added in another tab", () => {
    watch(["GA"]);
    const { latest } = mount();
    expect(latest().watching).toBe(1);

    act(() => {
      localStorage.setItem(
        WATCHES_STORAGE_KEY,
        JSON.stringify([
          { address: "GA", filters: DEFAULT_OPERATION_FILTERS },
          { address: "GB", filters: DEFAULT_OPERATION_FILTERS },
        ]),
      );
      window.dispatchEvent(new StorageEvent("storage", { key: WATCHES_STORAGE_KEY }));
    });

    expect(latest().watching).toBe(2);
  });

  it("closes the socket when the last watch is removed", () => {
    watch(["GA"]);
    mount();
    act(() => {
      socket.open();
      socket.ack();
    });

    act(() => watch([]));

    expect(socket.closed).toBe(true);
    expect(client.getState()).toBe("idle");
  });

  it("reports the connection state, so the feed can say it is not live", () => {
    watch(["GA"]);
    const { latest } = mount();

    expect(latest().state).toBe("connecting");
    act(() => {
      socket.open();
      socket.ack();
    });
    expect(latest().state).toBe("connected");

    act(() => socket.drop(1006));
    expect(latest().state).toBe("reconnecting");
  });
});
