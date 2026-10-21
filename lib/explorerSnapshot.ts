import type { StorageLike } from "./filterPresets";
import type { Transaction } from "./types";

/**
 * Everything the explorer needs to come back exactly as the user left it.
 *
 * A virtualized list only mounts the rows inside the viewport, so rebuilding
 * the component from scratch loses two separate things: the pages that had
 * been fetched (a cursor is only valid against the rows it produced) and the
 * pixel offset into the list. Capturing both together is what makes "back"
 * feel like a return rather than a restart.
 */
export interface ExplorerSnapshot {
  /** The list of transactions loaded for this view at the moment of capture. */
  txs: Transaction[];
  /** Pagination cursor for loading the next page; `null` means no more pages or unknown. */
  cursor: string | null;
  /** Whether another page is available beyond what is stored. */
  hasNextPage: boolean;
  /** Scroll position in pixels to restore the virtualized list to. */
  scrollTop: number;
}

/**
 * The shape persisted to storage for an {@link ExplorerSnapshot}.
 *
 * Adds `savedAt` so staleness can be evaluated on read — snapshots older than
 * {@link EXPLORER_SNAPSHOT_MAX_AGE_MS} are dropped to avoid restoring pages that
 * may be stale against a moving indexer.
 */
export interface StoredExplorerSnapshot extends ExplorerSnapshot {
  /** Unix timestamp (ms) when the snapshot was saved. */
  savedAt: number;
}

/**
 * Storage key prefix for explorer snapshots.
 *
 * Keys are namespaced per browser tab via `sessionStorage` and further scoped
 * by the filter query string (see {@link explorerSnapshotKey}) so different
 * filtered views never overwrite each other.
 */
export const EXPLORER_SNAPSHOT_PREFIX = "lumina.transactionExplorer.";

/**
 * Maximum age for a stored snapshot.
 *
 * A snapshot is a within-session convenience, not a cache: rows older than this
 * would be stale against an indexer that keeps moving, so they are dropped and
 * the view starts over. The value is 30 minutes.
 */
export const EXPLORER_SNAPSHOT_MAX_AGE_MS = 30 * 60 * 1000;

/**
 * Build the storage key for a given explorer filter query.
 *
 * The unfiltered view maps onto a single stable key (`""` and `"all"` are
 * equivalent). Callers pass the current query string/state that identifies the
 * filtered view (e.g. `"status=failed"`). Use this key when reading/writing
 * directly to storage or when reasoning about snapshot scoping.
 *
 * @param query - Filter/query identifier for the current explorer view (empty string means unfiltered).
 * @returns Namespaced key used in storage for this view.
 */
export function explorerSnapshotKey(query: string): string {
  return `${EXPLORER_SNAPSHOT_PREFIX}${query || "all"}`;
}

/**
 * Get a `StorageLike` implementation suitable for explorer snapshots.
 *
 * Uses `sessionStorage` rather than `localStorage`: the loaded pages belong to
 * the tab that fetched them, and a brand-new tab should start from page one.
 * Returns `null` when storage is not available (e.g. during server-side render)
 * or when accessing it throws (e.g. site data blocked). In all "no storage"
 * cases this function treats absence as "no snapshot" rather than throwing.
 *
 * @returns A storage instance or `null` if unavailable.
 */
export function getSessionStorage(): StorageLike | null {
  try {
    // Absent during a server render, and throws outright when a browser has
    // site data blocked — both mean "no snapshot", not "crash the page".
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Load a previously saved explorer snapshot for the given filter view.
 *
 * Returns `null` if there is nothing usable to restore: missing storage, no
 * entry, corrupt JSON, missing/invalid shape, or the snapshot is older than
 * {@link EXPLORER_SNAPSHOT_MAX_AGE_MS}. On read, missing/non-string `cursor`
 * becomes `null`, missing/non-boolean `hasNextPage` defaults to `true`,
 * and non-positive `scrollTop` is normalized to `0`. Any storage access or
 * parsing errors are caught and result in `null` (restore never crashes the page).
 *
 * @param query - Filter/query identifier for the view to restore (see {@link explorerSnapshotKey}).
 * @param storage - Storage to read from; defaults to {@link getSessionStorage()}.
 * @returns The restored snapshot, or `null` if nothing usable exists.
 */
export function loadExplorerSnapshot(
  query: string,
  storage: StorageLike | null = getSessionStorage(),
): ExplorerSnapshot | null {
  if (!storage) return null;

  try {
    const raw = storage.getItem(explorerSnapshotKey(query));
    if (!raw) return null;

    const stored = JSON.parse(raw) as Partial<StoredExplorerSnapshot> | null;
    if (!stored || typeof stored !== "object" || !Array.isArray(stored.txs)) return null;

    const savedAt = typeof stored.savedAt === "number" ? stored.savedAt : 0;
    if (Date.now() - savedAt > EXPLORER_SNAPSHOT_MAX_AGE_MS) return null;

    return {
      txs: stored.txs,
      cursor: typeof stored.cursor === "string" ? stored.cursor : null,
      hasNextPage: stored.hasNextPage !== false,
      scrollTop:
        typeof stored.scrollTop === "number" && stored.scrollTop > 0 ? stored.scrollTop : 0,
    };
  } catch {
    // Corrupt or unreadable storage restores nothing rather than breaking the
    // page it is rendered on.
    return null;
  }
}

/**
 * Persist an explorer snapshot for the given filter view (best effort).
 *
 * Adds `savedAt` (current time in ms) before writing. If `storage` is `null`
 * or unavailable/blocked, the call is a no-op. Any errors thrown by
 * `setItem`/serialization are swallowed — saving is non-critical (losing
 * scroll/cursor only costs the reader their position). This is safe to call
 * from effects/handlers without try/catch.
 *
 * @param query - Filter/query identifier for the view to save (see {@link explorerSnapshotKey}).
 * @param snapshot - The snapshot to persist ({@link ExplorerSnapshot}).
 * @param storage - Storage to write to; defaults to {@link getSessionStorage()}.
 */
export function saveExplorerSnapshot(
  query: string,
  snapshot: ExplorerSnapshot,
  storage: StorageLike | null = getSessionStorage(),
): void {
  if (!storage) return;

  try {
    const stored: StoredExplorerSnapshot = { ...snapshot, savedAt: Date.now() };
    storage.setItem(explorerSnapshotKey(query), JSON.stringify(stored));
  } catch {
    // Ignored on purpose, see above.
  }
}
