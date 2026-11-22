import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addRecentlyViewed,
  clearRecentlyViewed,
  getRecentlyViewed,
  getRecentlyViewedByType,
  MAX_ITEMS,
  readRecentlyViewed,
  RECENTLY_VIEWED_KEY,
  removeRecentlyViewed,
  saveRecentlyViewed,
  type ViewedEntity,
} from "./recentlyViewed";

// The suite runs in node, so the module's `window.localStorage` is an explicit
// in-memory stand-in that each test can inspect or make fail.
function createStorage() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      data.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      data.delete(key);
    }),
    clear: vi.fn(() => data.clear()),
  };
}

let storage: ReturnType<typeof createStorage>;

beforeEach(() => {
  storage = createStorage();
  vi.stubGlobal("window", { localStorage: storage });
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const stored = (): ViewedEntity[] =>
  JSON.parse(storage.data.get(RECENTLY_VIEWED_KEY) ?? "[]");

describe("addRecentlyViewed", () => {
  it("stores an entry with the current time under the module's key", () => {
    addRecentlyViewed("GABC", "account", "Alice", "/accounts/GABC");

    expect(storage.setItem).toHaveBeenCalledWith(RECENTLY_VIEWED_KEY, expect.any(String));
    expect(stored()).toEqual([
      {
        id: "GABC",
        type: "account",
        label: "Alice",
        path: "/accounts/GABC",
        timestamp: Date.parse("2026-01-01T00:00:00Z"),
      },
    ]);
  });

  it("puts the most recent view first", () => {
    addRecentlyViewed("a", "account", "A", "/accounts/a");
    vi.advanceTimersByTime(1000);
    addRecentlyViewed("t", "transaction", "T", "/transactions/t");
    vi.advanceTimersByTime(1000);
    addRecentlyViewed("c", "contract", "C", "/contracts/c");

    expect(getRecentlyViewed().map((e) => e.id)).toEqual(["c", "t", "a"]);
    const times = getRecentlyViewed().map((e) => e.timestamp);
    expect(times).toEqual([...times].sort((x, y) => y - x));
  });

  it("moves a re-viewed entity to the front instead of duplicating it", () => {
    addRecentlyViewed("a", "account", "A", "/accounts/a");
    addRecentlyViewed("b", "account", "B", "/accounts/b");
    vi.advanceTimersByTime(5000);
    addRecentlyViewed("a", "account", "A (renamed)", "/accounts/a");

    const items = getRecentlyViewed();
    expect(items.map((e) => e.id)).toEqual(["a", "b"]);
    expect(items[0].label).toBe("A (renamed)");
    expect(items[0].timestamp).toBe(Date.parse("2026-01-01T00:00:05Z"));
  });

  it("keeps entries that share an id but differ in type", () => {
    addRecentlyViewed("same", "account", "Account", "/accounts/same");
    addRecentlyViewed("same", "contract", "Contract", "/contracts/same");

    expect(getRecentlyViewed().map((e) => `${e.type}:${e.id}`)).toEqual([
      "contract:same",
      "account:same",
    ]);
  });

  it(`caps the list at MAX_ITEMS (${MAX_ITEMS}), dropping the oldest`, () => {
    for (let i = 0; i < MAX_ITEMS + 5; i++) {
      addRecentlyViewed(`id-${i}`, "transaction", `T${i}`, `/transactions/${i}`);
    }

    const items = getRecentlyViewed();
    expect(items).toHaveLength(MAX_ITEMS);
    expect(items[0].id).toBe(`id-${MAX_ITEMS + 4}`);
    expect(items[MAX_ITEMS - 1].id).toBe("id-5");
    expect(items.some((e) => e.id === "id-4")).toBe(false);
  });

  it("re-viewing an entity at the cap does not evict anything", () => {
    for (let i = 0; i < MAX_ITEMS; i++) {
      addRecentlyViewed(`id-${i}`, "account", `A${i}`, `/accounts/${i}`);
    }

    addRecentlyViewed("id-0", "account", "A0", "/accounts/0");

    const items = getRecentlyViewed();
    expect(items).toHaveLength(MAX_ITEMS);
    expect(items[0].id).toBe("id-0");
    expect(items.some((e) => e.id === "id-1")).toBe(true);
  });
});

describe("reading", () => {
  beforeEach(() => {
    addRecentlyViewed("a1", "account", "A1", "/accounts/a1");
    addRecentlyViewed("t1", "transaction", "T1", "/transactions/t1");
    addRecentlyViewed("a2", "account", "A2", "/accounts/a2");
  });

  it("getRecentlyViewed returns everything without a limit and the newest N with one", () => {
    expect(getRecentlyViewed().map((e) => e.id)).toEqual(["a2", "t1", "a1"]);
    expect(getRecentlyViewed(2).map((e) => e.id)).toEqual(["a2", "t1"]);
    expect(getRecentlyViewed(0).map((e) => e.id)).toEqual(["a2", "t1", "a1"]);
  });

  it("getRecentlyViewedByType keeps recency order within a type", () => {
    expect(getRecentlyViewedByType("account").map((e) => e.id)).toEqual(["a2", "a1"]);
    expect(getRecentlyViewedByType("contract")).toEqual([]);
  });

  it("removeRecentlyViewed removes only the matching id and type", () => {
    removeRecentlyViewed("a1", "account");
    removeRecentlyViewed("t1", "account");

    expect(getRecentlyViewed().map((e) => e.id)).toEqual(["a2", "t1"]);
  });

  it("clearRecentlyViewed empties the list", () => {
    clearRecentlyViewed();

    expect(storage.data.get(RECENTLY_VIEWED_KEY)).toBe("[]");
    expect(getRecentlyViewed()).toEqual([]);
  });
});

describe("storage failures", () => {
  it("reads an empty list when nothing is stored", () => {
    expect(readRecentlyViewed()).toEqual([]);
    expect(storage.getItem).toHaveBeenCalledWith(RECENTLY_VIEWED_KEY);
  });

  it("reads an empty list when the stored value is not JSON", () => {
    storage.data.set(RECENTLY_VIEWED_KEY, "{not json");

    expect(readRecentlyViewed()).toEqual([]);
  });

  it("reads an empty list when storage throws (e.g. blocked in a private window)", () => {
    storage.getItem.mockImplementation(() => {
      throw new Error("SecurityError");
    });

    expect(readRecentlyViewed()).toEqual([]);
  });

  it("swallows a failed write (e.g. quota exceeded)", () => {
    storage.setItem.mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    expect(() => saveRecentlyViewed([])).not.toThrow();
    expect(() => addRecentlyViewed("a", "account", "A", "/accounts/a")).not.toThrow();
  });

  it("reads an empty list when there is no window at all", () => {
    vi.unstubAllGlobals();

    expect(readRecentlyViewed()).toEqual([]);
    expect(() => addRecentlyViewed("a", "account", "A", "/accounts/a")).not.toThrow();
  });
});
