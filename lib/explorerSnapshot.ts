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
  txs: Transaction[];
  cursor: string | null;
  hasNextPage: boolean;
  scrollTop: number;
}

export interface StoredExplorerSnapshot extends ExplorerSnapshot {
  savedAt: number;
}

export const EXPLORER_SNAPSHOT_PREFIX = "lumina.transactionExplorer.";

/**
 * A snapshot is a within-session convenience, not a cache: rows older than this
 * would be stale against an indexer that keeps moving, so they are dropped and
 * the view starts over.
 */
export const EXPLORER_SNAPSHOT_MAX_AGE_MS = 30 * 60 * 1000;

export function explorerSnapshotKey(query: string): string {
  return `${EXPLORER_SNAPSHOT_PREFIX}${query || "all"}`;
}

/**
 * `sessionStorage` rather than `localStorage`: the loaded pages belong to the
 * tab that fetched them, and a brand-new tab should start from page one.
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

/** Returns null when there is nothing usable to restore for this filter view. */
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

/** Best effort: a full or blocked store only costs the reader their position. */
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
