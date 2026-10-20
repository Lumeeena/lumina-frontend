import { beforeEach, describe, expect, it } from "vitest";
import {
  invalidateQueryCache,
  isFresh,
  MAX_CACHED_QUERIES,
  queryGeneration,
  queryKey,
  readQuery,
  writeQuery,
} from "./queryCache";

const ENDPOINT = "https://api.example.com/graphql";
const QUERY = "query Volume($asset: String!) { asset(asset: $asset) { series } }";

beforeEach(() => {
  invalidateQueryCache();
});

describe("queryKey", () => {
  it("differs by endpoint, document and variables", () => {
    const base = queryKey(ENDPOINT, QUERY, { asset: "XLM" });

    expect(queryKey("https://other.example.com/graphql", QUERY, { asset: "XLM" })).not.toBe(base);
    expect(queryKey(ENDPOINT, `${QUERY} `, { asset: "XLM" })).not.toBe(base);
    expect(queryKey(ENDPOINT, QUERY, { asset: "USDC" })).not.toBe(base);
  });

  it("is the same for the same inputs, so a repeat read finds its entry", () => {
    expect(queryKey(ENDPOINT, QUERY, { asset: "XLM" })).toBe(queryKey(ENDPOINT, QUERY, { asset: "XLM" }));
  });
});

describe("readQuery and writeQuery", () => {
  it("returns undefined for a key that was never written", () => {
    expect(readQuery("missing")).toBeUndefined();
  });

  it("returns the stored data with the time it was stored", () => {
    const generation = queryGeneration();
    writeQuery("k", { value: 1 }, { generation, now: 500 });

    expect(readQuery<{ value: number }>("k")).toEqual({ data: { value: 1 }, storedAt: 500 });
  });

  it("overwrites an existing entry with the newer answer", () => {
    const generation = queryGeneration();
    writeQuery("k", "old", { generation, now: 1 });
    writeQuery("k", "new", { generation, now: 2 });

    expect(readQuery<string>("k")).toEqual({ data: "new", storedAt: 2 });
  });

  it("evicts the least recently written entry once the cap is exceeded", () => {
    const generation = queryGeneration();
    for (let i = 0; i < MAX_CACHED_QUERIES; i++) {
      writeQuery(`k${i}`, i, { generation });
    }
    // Rewriting k0 makes it the newest, so k1 is what gets evicted next.
    writeQuery("k0", "refreshed", { generation });
    writeQuery("extra", "x", { generation });

    expect(readQuery("k0")).toBeDefined();
    expect(readQuery("k1")).toBeUndefined();
    expect(readQuery("extra")).toBeDefined();
  });

  it("drops a write whose read started before an invalidation", () => {
    const startedBefore = queryGeneration();
    invalidateQueryCache();
    writeQuery("k", "stale", { generation: startedBefore });

    expect(readQuery("k")).toBeUndefined();
  });
});

describe("isFresh", () => {
  it("is fresh strictly inside the window", () => {
    expect(isFresh({ storedAt: 1_000 }, 500, 1_499)).toBe(true);
  });

  it("is stale at and past the window's end", () => {
    expect(isFresh({ storedAt: 1_000 }, 500, 1_500)).toBe(false);
    expect(isFresh({ storedAt: 1_000 }, 500, 9_000)).toBe(false);
  });

  it("defaults to the current time", () => {
    expect(isFresh({ storedAt: Date.now() }, 60_000)).toBe(true);
  });
});

describe("invalidateQueryCache", () => {
  it("empties the cache", () => {
    writeQuery("k", "v", { generation: queryGeneration() });
    invalidateQueryCache();

    expect(readQuery("k")).toBeUndefined();
  });

  it("advances the generation so in-flight reads are discarded", () => {
    const before = queryGeneration();
    invalidateQueryCache();

    expect(queryGeneration()).toBe(before + 1);
  });
});
