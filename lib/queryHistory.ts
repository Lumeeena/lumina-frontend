import { getStorage, type StorageLike } from "./filterPresets";

export const QUERY_HISTORY_STORAGE_KEY = "lumina.graphqlQueryHistory";
export const QUERY_HISTORY_LIMIT = 20;

export function loadQueryHistory(storage: StorageLike | null = getStorage()): string[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(QUERY_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((query): query is string => typeof query === "string" && query.trim().length > 0)
      .slice(0, QUERY_HISTORY_LIMIT);
  } catch {
    return [];
  }
}

/** Adds or promotes a query to the front of history; storage failures are harmless. */
export function saveQueryToHistory(
  query: string,
  storage: StorageLike | null = getStorage(),
): string[] {
  const trimmed = query.trim();
  const current = loadQueryHistory(storage);
  if (!trimmed) return current;

  const next = [trimmed, ...current.filter(item => item !== trimmed)].slice(0, QUERY_HISTORY_LIMIT);
  if (!storage) return current;
  try {
    storage.setItem(QUERY_HISTORY_STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return current;
  }
}