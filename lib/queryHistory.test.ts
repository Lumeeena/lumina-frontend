import { describe, expect, it } from "vitest";
import { loadQueryHistory, QUERY_HISTORY_LIMIT, QUERY_HISTORY_STORAGE_KEY, saveQueryToHistory } from "./queryHistory";
import type { StorageLike } from "./filterPresets";

function storageWith(initial: string | null = null): StorageLike {
  let value = initial;
  return {
    getItem: () => value,
    setItem: (_key, next) => { value = next; },
  };
}

describe("GraphQL query history", () => {
  it("saves queries, promotes duplicates, and reloads recent entries", () => {
    const storage = storageWith();
    saveQueryToHistory(" query { account { address } } ", storage);
    saveQueryToHistory("query { transactions { items { hash } } }", storage);
    const list = saveQueryToHistory("query { account { address } }", storage);

    expect(list).toEqual(["query { account { address } }", "query { transactions { items { hash } } }"]);
    expect(JSON.parse(storage.getItem(QUERY_HISTORY_STORAGE_KEY)!)).toEqual(list);
    expect(loadQueryHistory(storage)).toEqual(list);
  });

  it("limits history and ignores corrupt or unavailable storage", () => {
    const storage = storageWith();
    for (let index = 0; index <= QUERY_HISTORY_LIMIT; index++) saveQueryToHistory(`query ${index}`, storage);
    expect(loadQueryHistory(storage)).toHaveLength(QUERY_HISTORY_LIMIT);
    expect(loadQueryHistory(storageWith("not json"))).toEqual([]);
    expect(saveQueryToHistory("query", null)).toEqual([]);
    expect(loadQueryHistory({ getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } })).toEqual([]);
  });
});