import { beforeEach, describe, expect, it } from "vitest";
import {
  MAX_WATCHES,
  WATCHES_STORAGE_KEY,
  addWatch,
  exportWatches,
  importWatches,
  isWatched,
  loadWatches,
  removeWatch,
  setWatchFilters,
  toggleWatch,
  watchFiltersFor,
  watchListIsFull,
  watchedAddresses,
} from "./watches";
import {
  DEFAULT_OPERATION_FILTERS,
  EMPTY_OPERATION_FILTERS,
} from "./operationFilters";

/** The slice of localStorage these tests use, so nothing touches the real one. */
function memoryStorage(initial?: string) {
  const data = new Map<string, string>();
  if (initial !== undefined) data.set(WATCHES_STORAGE_KEY, initial);
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    raw: () => data.get(WATCHES_STORAGE_KEY) ?? null,
    set: (value: string) => void data.set(WATCHES_STORAGE_KEY, value),
  };
}

const ADDRESS = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVW2";
const OTHER = "SABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVW2";

describe("loadWatches", () => {
  it("returns nothing when storage is empty or absent", () => {
    expect(loadWatches(memoryStorage())).toEqual([]);
    expect(loadWatches(null)).toEqual([]);
  });

  it("returns nothing for corrupt or non-array JSON", () => {
    for (const raw of ["{", "null", "42", '{"a":1}']) {
      expect(loadWatches(memoryStorage(raw))).toEqual([]);
    }
  });

  it("drops entries that are not addresses", () => {
    const storage = memoryStorage(JSON.stringify([ADDRESS, "", "   ", 7, null, {}]));
    expect(watchedAddresses(storage)).toEqual([ADDRESS]);
  });

  it("de-duplicates, so one address cannot open two subscriptions", () => {
    const storage = memoryStorage(JSON.stringify([ADDRESS, ADDRESS, OTHER]));
    expect(watchedAddresses(storage)).toEqual([ADDRESS, OTHER]);
  });
});

describe("legacy format", () => {
  // #85 shipped a bare array of address strings. Upgrading must not cost
  // anyone their watch list — that is the kind of thing that makes them never
  // trust the feature again.
  it("loads a bare string array and gives each entry the default filter", () => {
    const storage = memoryStorage(JSON.stringify([ADDRESS, OTHER]));

    const entries = loadWatches(storage);

    expect(entries.map((entry) => entry.address)).toEqual([ADDRESS, OTHER]);
    for (const entry of entries) {
      expect(entry.filters).toEqual(DEFAULT_OPERATION_FILTERS);
    }
  });

  it("survives a round trip through the new format", () => {
    const legacy = memoryStorage(JSON.stringify([ADDRESS]));
    addWatch(OTHER, legacy);

    const reread = memoryStorage(legacy.raw());
    expect(watchedAddresses(reread)).toEqual([ADDRESS, OTHER]);
    expect(loadWatches(reread)[0].filters).toEqual(DEFAULT_OPERATION_FILTERS);
  });

  it("repairs a legacy entry that was saved with a half-written filter", () => {
    const storage = memoryStorage(
      JSON.stringify([{ address: ADDRESS, filters: { operationType: "BOGUS" } }]),
    );
    expect(loadWatches(storage)[0].filters).toEqual(DEFAULT_OPERATION_FILTERS);
  });
});

describe("addWatch / removeWatch / toggleWatch", () => {
  let storage: ReturnType<typeof memoryStorage>;
  beforeEach(() => {
    storage = memoryStorage();
  });

  it("adds, reports and persists", () => {
    addWatch(ADDRESS, storage);

    expect(isWatched(ADDRESS, storage)).toBe(true);
    expect(watchedAddresses(storage)).toEqual([ADDRESS]);
  });

  it("does not duplicate an existing watch", () => {
    addWatch(ADDRESS, storage);
    addWatch(ADDRESS, storage);

    expect(watchedAddresses(storage)).toEqual([ADDRESS]);
  });

  it("stores the filter it is given, not a shared default object", () => {
    // A shared reference would let one watch's edit change every other watch.
    addWatch(ADDRESS, storage, { ...EMPTY_OPERATION_FILTERS, minAmount: 5 });

    const entries = loadWatches(storage);
    expect(entries[0].filters.minAmount).toBe(5);
    expect(DEFAULT_OPERATION_FILTERS.minAmount).toBeNull();
  });

  it("refuses to add past the cap rather than opening unbounded subscriptions", () => {
    for (let i = 0; i < MAX_WATCHES; i++) addWatch(`${ADDRESS}-${i}`, storage);
    expect(watchListIsFull(storage)).toBe(true);

    addWatch(OTHER, storage);

    expect(loadWatches(storage)).toHaveLength(MAX_WATCHES);
    expect(isWatched(OTHER, storage)).toBe(false);
  });

  it("removes a watch and leaves the rest alone", () => {
    addWatch(ADDRESS, storage);
    addWatch(OTHER, storage);

    removeWatch(ADDRESS, storage);

    expect(watchedAddresses(storage)).toEqual([OTHER]);
  });

  it("is a no-op when removing something that is not watched", () => {
    addWatch(ADDRESS, storage);
    const before = storage.raw();

    removeWatch(OTHER, storage);

    expect(storage.raw()).toBe(before);
  });

  it("toggles in both directions and reports the new state", () => {
    expect(toggleWatch(ADDRESS, storage)).toBe(true);
    expect(toggleWatch(ADDRESS, storage)).toBe(false);
    expect(isWatched(ADDRESS, storage)).toBe(false);
  });
});

describe("setWatchFilters", () => {
  it("replaces the filter on one watch without touching the others", () => {
    const storage = memoryStorage();
    addWatch(ADDRESS, storage);
    addWatch(OTHER, storage);

    setWatchFilters(ADDRESS, { ...EMPTY_OPERATION_FILTERS, asset: "USDC" }, storage);

    expect(watchFiltersFor(ADDRESS, storage).asset).toBe("USDC");
    expect(watchFiltersFor(OTHER, storage)).toEqual(DEFAULT_OPERATION_FILTERS);
  });

  it("ignores an address that is not watched", () => {
    const storage = memoryStorage();
    addWatch(ADDRESS, storage);
    const before = storage.raw();

    setWatchFilters(OTHER, EMPTY_OPERATION_FILTERS, storage);

    expect(storage.raw()).toBe(before);
  });

  it("repairs an invalid filter rather than storing it", () => {
    const storage = memoryStorage();
    addWatch(ADDRESS, storage);

    setWatchFilters(
      ADDRESS,
      { operationType: "NOPE", minAmount: Number.NaN, asset: "  " } as never,
      storage,
    );

    expect(watchFiltersFor(ADDRESS, storage)).toEqual({
      ...DEFAULT_OPERATION_FILTERS,
      asset: "",
    });
  });
});

describe("watchFiltersFor", () => {
  it("gives the default for an address that is not watched", () => {
    expect(watchFiltersFor(ADDRESS, memoryStorage())).toEqual(
      DEFAULT_OPERATION_FILTERS,
    );
  });
});

describe("no storage available", () => {
  it("behaves as an empty list rather than throwing", () => {
    expect(loadWatches(null)).toEqual([]);
    expect(isWatched(ADDRESS, null)).toBe(false);
    expect(toggleWatch(ADDRESS, null)).toBe(true);
    expect(watchFiltersFor(ADDRESS, null)).toEqual(DEFAULT_OPERATION_FILTERS);
  });
});

describe("exportWatches & importWatches", () => {
  it("exports and imports cleanly in replace mode", () => {
    const storage = memoryStorage();
    addWatch(ADDRESS, storage);
    addWatch(OTHER, storage);

    const exported = exportWatches(storage);
    const targetStorage = memoryStorage();

    const result = importWatches(exported, "replace", targetStorage);
    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
    expect(watchedAddresses(targetStorage)).toEqual([ADDRESS, OTHER]);
  });

  it("merges imported watches with existing ones without duplicating", () => {
    const storage = memoryStorage();
    addWatch(ADDRESS, storage);

    const importData = JSON.stringify([ADDRESS, OTHER]);
    const result = importWatches(importData, "merge", storage);

    expect(result.success).toBe(true);
    expect(watchedAddresses(storage)).toEqual([ADDRESS, OTHER]);
  });

  it("rejects invalid JSON with a clear error message", () => {
    const storage = memoryStorage();
    const result = importWatches("{ invalid json }", "merge", storage);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid JSON format");
  });

  it("rejects non-array JSON structure", () => {
    const storage = memoryStorage();
    const result = importWatches(JSON.stringify({ address: ADDRESS }), "merge", storage);

    expect(result.success).toBe(false);
    expect(result.error).toContain("expected a JSON array");
  });

  it("rejects file containing no valid addresses", () => {
    const storage = memoryStorage();
    const result = importWatches(JSON.stringify([123, null, ""]), "merge", storage);

    expect(result.success).toBe(false);
    expect(result.error).toContain("no valid Stellar address entries");
  });
});

