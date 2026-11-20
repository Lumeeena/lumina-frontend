// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { FakeSocket } from "@/lib/__fixtures__/fakeSocket";
import { SubscriptionClient } from "@/lib/subscriptions";
import { __setSubscriptionClient } from "@/lib/useSubscription";
import {
  __resetNotificationStore,
  getSnapshot,
} from "@/lib/notifications";
import { WATCHES_STORAGE_KEY } from "@/lib/watches";
import type { Operation } from "@/lib/types";
import WatchActivityWatcher from "./WatchActivityWatcher";

const ADDRESS = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS";

let socket: FakeSocket;
let client: SubscriptionClient;

function setWatches(addresses: string[]) {
  localStorage.setItem(WATCHES_STORAGE_KEY, JSON.stringify(addresses));
  window.dispatchEvent(new CustomEvent("lumina:watches"));
}

function operation(): Operation {
  return {
    id: "operation-1",
    type: "PAYMENT",
    createdAt: "2026-03-01T12:00:00Z",
    transactionHash: "a".repeat(64),
    sourceAccount: ADDRESS,
    from: ADDRESS,
    to: "GOTHERACCOUNT234567ABCDEFGHIJKLMNOPQRSTUV",
    amount: "12",
    asset: "XLM",
  } as Operation;
}

beforeEach(() => {
  localStorage.clear();
  __resetNotificationStore();
  socket = new FakeSocket("ws://test/graphql");
  client = new SubscriptionClient({
    url: socket.url,
    createSocket: () => socket,
    schedule: () => 0,
    cancel: () => {},
  });
  __setSubscriptionClient(client);
});

afterEach(() => {
  cleanup();
  __setSubscriptionClient(null);
});

describe("WatchActivityWatcher", () => {
  it("subscribes for watched addresses and records matching activity", () => {
    setWatches([ADDRESS]);
    render(<WatchActivityWatcher />);

    act(() => {
      socket.open();
      socket.ack();
    });

    const subscription = socket.framesOfType("subscribe")[0];
    expect(subscription).toBeDefined();
    expect((subscription.payload as { variables: { address: string } }).variables.address).toBe(
      ADDRESS,
    );

    act(() => {
      socket.deliver({
        id: subscription.id,
        type: "next",
        payload: { data: { accountActivity: operation() } },
      });
    });

    expect(getSnapshot()).toHaveLength(1);
    expect(getSnapshot()[0].address).toBe(ADDRESS);
  });

  it("does not connect without watched addresses and stops after the last is removed", () => {
    setWatches([]);
    const { unmount } = render(<WatchActivityWatcher />);

    expect(client.getState()).toBe("idle");
    expect(socket.framesOfType("subscribe")).toHaveLength(0);

    act(() => setWatches([ADDRESS]));
    act(() => {
      socket.open();
      socket.ack();
    });
    expect(socket.framesOfType("subscribe")).toHaveLength(1);

    act(() => setWatches([]));
    expect(socket.framesOfType("complete")).toHaveLength(1);

    unmount();
  });
});
