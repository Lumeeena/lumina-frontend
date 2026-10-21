/**
 * A client-side cache for GraphQL reads. Part of #250.
 *
 * Every client read used to go to the network on mount, so moving between a
 * list and its detail and back refetched a list that had not changed. This
 * keeps the last answer per query so a repeat visit can paint at once, and the
 * caller decides how old an answer may be before it is refetched. An answer
 * older than that is still shown while the refresh runs, so revalidation never
 * blocks the render.
 *
 * Kept free of React so the rules (keying, staleness, eviction, invalidation)
 * are testable in plain Node. The cache lives in module scope, which is only
 * correct in the browser: a server render shares one module across requests, so
 * callers read and write it from effects and event handlers, never from render.
 */

/** Oldest entries are evicted past this, so a long session cannot grow the cache without bound. */
export const MAX_CACHED_QUERIES = 100;

interface CacheEntry {
  data: unknown;
  storedAt: number;
}

const entries = new Map<string, CacheEntry>();

/**
 * Bumped by every invalidation. A read that started before an invalidation
 * carries the old value, and its answer is dropped instead of written, so data
 * fetched before a state-changing action cannot repopulate the cache after it.
 */
let generation = 0;

/**
 * The key for one query. The URL is part of it because the same document can
 * be served from two endpoints. Variables are serialised as given, so callers
 * build them with a fixed property order.
 */
export function queryKey(
  url: string,
  query: string,
  variables: Record<string, unknown>,
): string {
  return JSON.stringify([url, query, variables]);
}

export function queryGeneration(): number {
  return generation;
}

/** The last answer stored under `key`, with the time it was stored. */
export function readQuery<T>(key: string): { data: T; storedAt: number } | undefined {
  const entry = entries.get(key);
  if (!entry) return undefined;
  return { data: entry.data as T, storedAt: entry.storedAt };
}

/**
 * Store an answer. `generation` is the value read before the request started;
 * if an invalidation happened since, the answer is stale by definition and is
 * ignored.
 */
export function writeQuery(
  key: string,
  data: unknown,
  { generation: startedAt, now = Date.now() }: { generation: number; now?: number },
): void {
  if (startedAt !== generation) return;
  // Delete before setting so a rewritten key moves to the newest position in
  // the Map's insertion order, which is what eviction relies on.
  entries.delete(key);
  entries.set(key, { data, storedAt: now });
  while (entries.size > MAX_CACHED_QUERIES) {
    const oldest = entries.keys().next().value;
    if (oldest === undefined) break;
    entries.delete(oldest);
  }
}

/** Whether an entry is young enough to serve without a refetch. */
export function isFresh(
  entry: { storedAt: number },
  staleMs: number,
  now: number = Date.now(),
): boolean {
  return now - entry.storedAt < staleMs;
}

/**
 * Forget every cached answer. Called after a transaction confirms, because any
 * cached read of account or contract state may now be wrong, and it is simpler
 * to refetch them all than to work out which ones a given write touched.
 */
export function invalidateQueryCache(): void {
  generation += 1;
  entries.clear();
}
