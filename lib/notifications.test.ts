// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  MAX_NOTIFICATIONS,
  NOTIFICATIONS_STORAGE_KEY,
  clearNotifications,
  getServerSnapshot,
  getSnapshot,
  loadNotifications,
  markAllRead,
  notificationId,
  recordActivity,
  shouldAlert,
  subscribeToNotifications,
  unreadCount,
  __resetNotificationStore,
} from "./notifications";
import { DEFAULT_OPERATION_FILTERS, EMPTY_OPERATION_FILTERS } from "./operationFilters";
import type { Operation } from "./types";

function memoryStorage(initial?: string) {
  const data = new Map<string, string>();
  if (initial !== undefined) data.set(NOTIFICATIONS_STORAGE_KEY, initial);
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    raw: () => data.get(NOTIFICATIONS_STORAGE_KEY) ?? null,
  };
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

beforeEach(() => {
  __resetNotificationStore();
});

describe("recordActivity", () => {
  it("records an alert as unread, newest first", () => {
    const storage = memoryStorage();

    recordActivity("GA", op({ id: "a" }), storage);
    recordActivity("GA", op({ id: "b" }), storage);

    const items = loadNotifications(storage);
    expect(items.map((item) => item.id)).toEqual([
      notificationId("GA", "b"),
      notificationId("GA", "a"),
    ]);
    expect(items.every((item) => !item.read)).toBe(true);
    expect(unreadCount(items)).toBe(2);
  });

  it("carries the fields the panel renders", () => {
    const storage = memoryStorage();
    recordActivity("GA", op({ id: "a", amount: "12.5", asset: "USDC" }), storage);

    expect(loadNotifications(storage)[0]).toEqual({
      id: notificationId("GA", "a"),
      address: "GA",
      operationType: "PAYMENT",
      transactionHash: "b".repeat(64),
      amount: "12.5",
      asset: "USDC",
      createdAt: "2026-03-01T12:00:00Z",
      read: false,
    });
  });

  it("returns the same reference for a duplicate, so re-renders do not loop", () => {
    // The server replays every active subscription after a reconnect, so a
    // repeat is the normal case. Asserted against the real storage path, which
    // is the one a React subscriber actually reads.
    localStorage.clear();
    __resetNotificationStore();

    const first = recordActivity("GA", op({ id: "a" }));
    const second = recordActivity("GA", op({ id: "a" }));

    expect(second).toBe(first);
    expect(loadNotifications()).toHaveLength(1);
  });

  it("scopes the dedupe key to the address", () => {
    // Two watched addresses can legitimately be in one transaction, and each
    // has its own watch, so each gets its own alert.
    const storage = memoryStorage();
    recordActivity("GA", op({ id: "shared" }), storage);
    recordActivity("GB", op({ id: "shared" }), storage);

    expect(loadNotifications(storage)).toHaveLength(2);
  });

  it("drops the oldest past the cap, so a long-lived tab cannot grow forever", () => {
    const storage = memoryStorage();
    for (let i = 0; i < MAX_NOTIFICATIONS + 5; i++) {
      recordActivity("GA", op({ id: `op-${i}` }), storage);
    }

    const items = loadNotifications(storage);
    expect(items).toHaveLength(MAX_NOTIFICATIONS);
    // The most recent survives; the oldest is what falls off.
    expect(items[0].id).toBe(notificationId("GA", `op-${MAX_NOTIFICATIONS + 4}`));
  });

  it("still updates in memory when storage refuses the write", () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota");
      },
    };

    expect(() => recordActivity("GA", op({ id: "a" }), storage)).not.toThrow();
  });
});

describe("loadNotifications", () => {
  it("returns nothing for corrupt or non-array JSON", () => {
    for (const raw of ["{", "null", "42", '{"a":1}']) {
      expect(loadNotifications(memoryStorage(raw))).toEqual([]);
    }
  });

  it("drops entries that are not notifications", () => {
    const raw = JSON.stringify([{ id: "a", address: "GA" }, null, 7, { address: "GB" }]);
    expect(loadNotifications(memoryStorage(raw))).toHaveLength(1);
  });

  it("repairs a partially written entry field by field", () => {
    const raw = JSON.stringify([{ id: "a", address: "GA", operationType: 5, read: "yes" }]);
    expect(loadNotifications(memoryStorage(raw))[0]).toEqual({
      id: "a",
      address: "GA",
      operationType: "UNKNOWN",
      transactionHash: "",
      amount: null,
      asset: null,
      createdAt: "",
      // Anything that is not literally `true` is unread: an unread alert is
      // safer to re-show than to silently swallow.
      read: false,
    });
  });
});

describe("markAllRead and clearNotifications", () => {
  it("marks everything read, and is a no-op the second time", () => {
    localStorage.clear();
    __resetNotificationStore();
    recordActivity("GA", op({ id: "a" }));

    const first = markAllRead();
    expect(first.every((item) => item.read)).toBe(true);
    expect(markAllRead()).toBe(first);
  });

  it("clears the tray, and is a no-op when already empty", () => {
    const storage = memoryStorage();
    expect(clearNotifications(storage)).toEqual([]);

    recordActivity("GA", op({ id: "a" }), storage);
    expect(clearNotifications(storage)).toEqual([]);
    expect(loadNotifications(storage)).toEqual([]);
  });
});

describe("shouldAlert", () => {
  it("respects the watch's own filters", () => {
    // #83: the same operation is an alert on one watch and not on another.
    const small = op({ amount: "1" });
    const large = op({ amount: "5000" });

    expect(shouldAlert(small, DEFAULT_OPERATION_FILTERS)).toBe(true);
    expect(
      shouldAlert(small, { ...DEFAULT_OPERATION_FILTERS, minAmount: 1000 }),
    ).toBe(false);
    expect(
      shouldAlert(large, { ...DEFAULT_OPERATION_FILTERS, minAmount: 1000 }),
    ).toBe(true);
    expect(shouldAlert(op({ type: "SET_OPTIONS" }), DEFAULT_OPERATION_FILTERS)).toBe(false);
    expect(
      shouldAlert(op({ type: "SET_OPTIONS" }), EMPTY_OPERATION_FILTERS),
    ).toBe(true);
  });
});

describe("external store", () => {
  it("notifies subscribers when a record arrives", () => {
    const storage = memoryStorage();
    let calls = 0;
    const unsubscribe = subscribeToNotifications(() => {
      calls += 1;
    });

    recordActivity("GA", op({ id: "a" }), storage);
    expect(calls).toBe(1);

    unsubscribe();
    recordActivity("GA", op({ id: "b" }), storage);
    expect(calls).toBe(1);
  });

  it("keeps a stable snapshot reference between changes", () => {
    // `getSnapshot` returning a fresh array each call makes React re-render in
    // a loop, which is the classic external-store bug.
    localStorage.clear();
    __resetNotificationStore();

    const empty = getSnapshot();
    expect(getSnapshot()).toBe(empty);

    recordActivity("GA", op({ id: "a" }));
    const afterWrite = getSnapshot();
    expect(afterWrite).not.toBe(empty);
    expect(getSnapshot()).toBe(afterWrite);
  });

  it("reports no alerts during a server render", () => {
    // A server render has no localStorage, so claiming there are alerts would
    // make the badge flash in and out on hydration.
    expect(getServerSnapshot()).toEqual([]);
  });
});
