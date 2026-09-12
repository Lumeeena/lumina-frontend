import { beforeEach, describe, expect, it } from "vitest";
import {
  PRESETS_STORAGE_KEY,
  deletePreset,
  loadPresets,
  savePreset,
  type StorageLike,
} from "./filterPresets";
import { EMPTY_FILTERS, type TransactionFilters } from "./transactionFilters";

class MemoryStorage implements StorageLike {
  private data = new Map<string, string>();

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  seed(value: string): void {
    this.data.set(PRESETS_STORAGE_KEY, value);
  }
}

/** Storage that throws on every access, like a browser with site data blocked. */
const hostileStorage: StorageLike = {
  getItem() {
    throw new Error("access denied");
  },
  setItem() {
    throw new Error("access denied");
  },
};

function filters(overrides: Partial<TransactionFilters> = {}): TransactionFilters {
  return { ...EMPTY_FILTERS, ...overrides };
}

let storage: MemoryStorage;

beforeEach(() => {
  storage = new MemoryStorage();
});

describe("filter presets", () => {
  it("starts empty", () => {
    expect(loadPresets(storage)).toEqual([]);
  });

  it("saves a preset and reads it back with its filters intact", () => {
    const saved = filters({ status: "failed", source: "GABC", maxFeeXlm: 0.25 });
    savePreset("My USDC payments", saved, storage);

    const [preset] = loadPresets(storage);
    expect(preset.name).toBe("My USDC payments");
    expect(preset.filters).toEqual(saved);
  });

  it("persists across a reload — a fresh read of the same storage still has it", () => {
    savePreset("Failures", filters({ status: "failed" }), storage);

    // Nothing is cached in the module; this is the same path a new page load
    // takes.
    expect(loadPresets(storage).map(p => p.name)).toEqual(["Failures"]);
  });

  it("keeps multiple presets", () => {
    savePreset("A", filters({ status: "failed" }), storage);
    savePreset("B", filters({ minOperations: 3 }), storage);

    expect(loadPresets(storage).map(p => p.name)).toEqual(["A", "B"]);
  });

  it("overwrites a preset saved under an existing name", () => {
    savePreset("Mine", filters({ status: "failed" }), storage);
    savePreset("Mine", filters({ status: "successful" }), storage);

    const presets = loadPresets(storage);
    expect(presets).toHaveLength(1);
    expect(presets[0].filters.status).toBe("successful");
  });

  it("trims the name and ignores a blank one", () => {
    savePreset("  Spaced  ", filters({ status: "failed" }), storage);
    expect(loadPresets(storage)[0].name).toBe("Spaced");

    savePreset("   ", filters({ status: "successful" }), storage);
    expect(loadPresets(storage)).toHaveLength(1);
  });

  it("deletes by name and leaves the others", () => {
    savePreset("A", filters({ status: "failed" }), storage);
    savePreset("B", filters({ status: "successful" }), storage);

    expect(deletePreset("A", storage).map(p => p.name)).toEqual(["B"]);
    expect(loadPresets(storage).map(p => p.name)).toEqual(["B"]);
  });

  it("deleting something that is not there is a no-op", () => {
    savePreset("A", filters({ status: "failed" }), storage);
    expect(deletePreset("nope", storage).map(p => p.name)).toEqual(["A"]);
  });

  it("survives a stored entry written by an older version", () => {
    // Query-string storage is why this works: a field added later simply picks
    // up its default instead of the whole entry failing to parse.
    storage.seed(JSON.stringify([{ name: "Legacy", query: "status=failed" }]));

    const [preset] = loadPresets(storage);
    expect(preset.filters.status).toBe("failed");
    expect(preset.filters.minOperations).toBeNull();
  });

  it("ignores corrupt storage rather than breaking the page", () => {
    storage.seed("{ not json");
    expect(loadPresets(storage)).toEqual([]);

    storage.seed(JSON.stringify({ notAnArray: true }));
    expect(loadPresets(storage)).toEqual([]);

    storage.seed(JSON.stringify([{ name: 42 }, null, { query: "status=failed" }]));
    expect(loadPresets(storage)).toEqual([]);
  });

  it("treats a storage that throws as having no presets", () => {
    expect(loadPresets(hostileStorage)).toEqual([]);
    expect(() => savePreset("A", filters({ status: "failed" }), hostileStorage)).not.toThrow();
    // And does not claim to have saved something that will be gone on reload.
    expect(savePreset("A", filters({ status: "failed" }), hostileStorage)).toEqual([]);
  });

  it("treats absent storage as having no presets", () => {
    expect(loadPresets(null)).toEqual([]);
    expect(savePreset("A", filters(), null)).toEqual([]);
  });
});
