import { afterEach, describe, expect, it, vi } from "vitest";
import {
  EXPLORER_SNAPSHOT_MAX_AGE_MS,
  explorerSnapshotKey,
  loadExplorerSnapshot,
  saveExplorerSnapshot,
  type ExplorerSnapshot,
} from "./explorerSnapshot";
import type { StorageLike } from "./filterPresets";
import type { Transaction } from "./types";

function storageWith(initial: string | null = null): StorageLike {
  let value = initial;
  return {
    getItem: () => value,
    setItem: (_key, next) => { value = next; },
  };
}

function tx(hash: string): Transaction {
  return {
    hash,
    ledger: 42,
    createdAt: "2026-09-27T00:00:00Z",
    sourceAccount: "GABCDEF",
    feeCharged: "100",
    operationCount: 1,
    successful: true,
  } as Transaction;
}

function snapshot(overrides: Partial<ExplorerSnapshot> = {}): ExplorerSnapshot {
  return { txs: [tx("a"), tx("b")], cursor: "cursor-1", hasNextPage: true, scrollTop: 4200, ...overrides };
}

describe("transaction explorer snapshots", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("round-trips the loaded rows, cursor, page flag and offset", () => {
    const storage = storageWith();
    const saved = snapshot();

    saveExplorerSnapshot("status=failed", saved, storage);

    expect(loadExplorerSnapshot("status=failed", storage)).toEqual(saved);
  });

  it("keys snapshots by the filter query so two views do not overwrite each other", () => {
    const storage = storageWith();

    saveExplorerSnapshot("", snapshot({ cursor: "all" }), storage);
    saveExplorerSnapshot("status=failed", snapshot({ cursor: "failed" }), storage);

    expect(loadExplorerSnapshot("", storage)?.cursor).toBe("all");
    expect(loadExplorerSnapshot("status=failed", storage)?.cursor).toBe("failed");
  });

  it("maps the unfiltered view onto a single stable key", () => {
    expect(explorerSnapshotKey("")).toBe(explorerSnapshotKey("all"));
    expect(explorerSnapshotKey("status=failed")).not.toBe(explorerSnapshotKey("all"));
  });

  it("returns null when this view has never been stored", () => {
    expect(loadExplorerSnapshot("status=failed", storageWith())).toBeNull();
  });

  it("expires a stale snapshot instead of restoring old rows", () => {
    const storage = storageWith();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-27T00:00:00Z"));
    saveExplorerSnapshot("", snapshot(), storage);

    vi.setSystemTime(new Date(Date.parse("2026-09-27T00:00:00Z") + EXPLORER_SNAPSHOT_MAX_AGE_MS - 1));
    expect(loadExplorerSnapshot("", storage)).not.toBeNull();

    vi.setSystemTime(new Date(Date.parse("2026-09-27T00:00:00Z") + EXPLORER_SNAPSHOT_MAX_AGE_MS + 1));
    expect(loadExplorerSnapshot("", storage)).toBeNull();
  });

  it("treats corrupt, unavailable or blocked storage as 'nothing to restore'", () => {
    expect(loadExplorerSnapshot("", storageWith("not json"))).toBeNull();
    expect(loadExplorerSnapshot("", storageWith('{"txs":null}'))).toBeNull();
    expect(loadExplorerSnapshot("", null)).toBeNull();

    const blocked: StorageLike = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
    };
    expect(loadExplorerSnapshot("", blocked)).toBeNull();
    expect(() => saveExplorerSnapshot("", snapshot(), blocked)).not.toThrow();
    expect(() => saveExplorerSnapshot("", snapshot(), null)).not.toThrow();
  });

  it("normalizes a missing cursor, a missing page flag and a non-positive offset", () => {
    const storage = storageWith();
    storage.setItem(
      explorerSnapshotKey(""),
      JSON.stringify({ txs: [tx("a")], scrollTop: -10, savedAt: Date.now() }),
    );

    expect(loadExplorerSnapshot("", storage)).toEqual({
      txs: [tx("a")],
      cursor: null,
      hasNextPage: true,
      scrollTop: 0,
    });
  });
});
