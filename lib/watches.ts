/**
 * Watch list — a localStorage-backed set of Stellar addresses the user wants to
 * track, each with the filter that decides what counts as activity. Part of
 * #9 / #85, extended for #80 and #83.
 *
 * The storage format is a plain JSON array. Entries are objects, but the
 * original format was a bare array of address strings, so a list written by
 * #85's build still loads — each legacy entry picks up the default filter
 * rather than being dropped. Losing someone's watch list on upgrade is the kind
 * of thing that makes them never trust the feature again.
 */

import {
  DEFAULT_OPERATION_FILTERS,
  normaliseOperationFilters,
  type OperationFilters,
} from "./operationFilters";

export const WATCHES_STORAGE_KEY = "lumina.watchedAddresses";

/**
 * How many addresses one tab will hold open subscriptions for.
 *
 * The connection count does not grow with the watch list — one socket carries
 * every subscription — but the number of `subscribe` frames on it does, and a
 * server is entitled to refuse them. Past a few dozen the feed is also no
 * longer readable as a list. This is a ceiling on adding, not on rendering: an
 * existing list is always shown in full.
 */
export const MAX_WATCHES = 50;

export interface WatchEntry {
  address: string;
  /** What this watch alerts on. Never undefined, even for a legacy entry. */
  filters: OperationFilters;
}

/** The slice of localStorage this module uses, injectable for tests. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function getStorage(): StorageLike | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    // Storage can throw on access alone in a sandboxed frame or with cookies
    // blocked, so this is not only an SSR concern.
    return null;
  }
}

function isAddress(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function toEntry(value: unknown): WatchEntry | null {
  if (isAddress(value)) {
    return { address: value, filters: { ...DEFAULT_OPERATION_FILTERS } };
  }
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;
  if (!isAddress(raw.address)) return null;
  return {
    address: raw.address,
    filters: normaliseOperationFilters(raw.filters),
  };
}

function load(storage: StorageLike | null): WatchEntry[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(WATCHES_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const entries: WatchEntry[] = [];
    const seen = new Set<string>();
    for (const value of parsed) {
      const entry = toEntry(value);
      // Duplicates are dropped rather than rendered twice: they would open two
      // subscriptions for one address and double every notification it sends.
      if (!entry || seen.has(entry.address)) continue;
      seen.add(entry.address);
      entries.push(entry);
    }
    return entries;
  } catch {
    return [];
  }
}

function persist(entries: WatchEntry[], storage: StorageLike | null): void {
  if (!storage) return;
  try {
    storage.setItem(WATCHES_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Quota full or blocked — silently ignore.
  }
  announce();
}

/**
 * Fired after any write to the watch list.
 *
 * The list is read from storage, so a component that only reads it once will
 * not notice an address being watched from a transaction row elsewhere on the
 * page. This is the same shape as the existing `lumina:online` event.
 */
export const WATCHES_EVENT = "lumina:watches";

function announce(): void {
  // A module-level `window` reference would break importing this file during a
  // server render, and its tests run in Node.
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") {
    return;
  }
  try {
    window.dispatchEvent(new CustomEvent(WATCHES_EVENT));
  } catch {
    // An environment with `window` but no CustomEvent; the write still stuck.
  }
}

/**
 * Run `listener` whenever the watch list changes, in this tab or another.
 *
 * `storage` events only fire in *other* tabs, so the same-tab case is served by
 * `WATCHES_EVENT`. Between them, a watch added on the transactions page is
 * picked up by the subscriptions in the layout without a reload.
 */
export function subscribeToWatches(listener: () => void): () => void {
  if (typeof window === "undefined" || typeof window.addEventListener !== "function") {
    return () => {};
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === WATCHES_STORAGE_KEY) listener();
  };
  window.addEventListener(WATCHES_EVENT, listener);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(WATCHES_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function loadWatches(storage: StorageLike | null = getStorage()): WatchEntry[] {
  return load(storage);
}

/** Just the addresses, for callers that do not care about the filters. */
export function watchedAddresses(
  storage: StorageLike | null = getStorage(),
): string[] {
  return load(storage).map((entry) => entry.address);
}

export function isWatched(
  address: string,
  storage: StorageLike | null = getStorage(),
): boolean {
  return load(storage).some((entry) => entry.address === address);
}

/** The filter this watch alerts on, or the default if it is not watched. */
export function watchFiltersFor(
  address: string,
  storage: StorageLike | null = getStorage(),
): OperationFilters {
  const entry = load(storage).find((candidate) => candidate.address === address);
  return entry ? entry.filters : { ...DEFAULT_OPERATION_FILTERS };
}

/** Whether a new watch would be refused for exceeding `MAX_WATCHES`. */
export function watchListIsFull(
  storage: StorageLike | null = getStorage(),
): boolean {
  return load(storage).length >= MAX_WATCHES;
}

/** Adds the address to the watch list. No-op if already present or at the cap. */
export function addWatch(
  address: string,
  storage: StorageLike | null = getStorage(),
  filters: OperationFilters = DEFAULT_OPERATION_FILTERS,
): WatchEntry[] {
  const current = load(storage);
  if (current.some((entry) => entry.address === address)) return current;
  if (current.length >= MAX_WATCHES) return current;
  const next = [...current, { address, filters: normaliseOperationFilters(filters) }];
  persist(next, storage);
  return next;
}

/** Removes the address from the watch list. No-op if not present. */
export function removeWatch(
  address: string,
  storage: StorageLike | null = getStorage(),
): WatchEntry[] {
  const current = load(storage);
  const next = current.filter((entry) => entry.address !== address);
  if (next.length === current.length) return current;
  persist(next, storage);
  return next;
}

/** Toggles the watch state; returns the new state (true = now watched). */
export function toggleWatch(
  address: string,
  storage: StorageLike | null = getStorage(),
): boolean {
  if (isWatched(address, storage)) {
    removeWatch(address, storage);
    return false;
  }
  addWatch(address, storage);
  return true;
}

/**
 * Replaces the filter on one watch. No-op if it is not watched.
 *
 * Going through this rather than a whole-list setter is what stops a caller
 * rewriting the list from clobbering a watch added in another tab.
 */
export function setWatchFilters(
  address: string,
  filters: OperationFilters,
  storage: StorageLike | null = getStorage(),
): WatchEntry[] {
  const current = load(storage);
  if (!current.some((entry) => entry.address === address)) return current;
  const next = current.map((entry) =>
    entry.address === address
      ? { address: entry.address, filters: normaliseOperationFilters(filters) }
      : entry,
  );
  persist(next, storage);
  return next;
}

/**
 * Exports the watch list as a JSON string.
 */
export function exportWatches(
  storage: StorageLike | null = getStorage(),
): string {
  const entries = loadWatches(storage);
  return JSON.stringify(entries, null, 2);
}

export interface ImportWatchesResult {
  success: boolean;
  count: number;
  error?: string;
}

/**
 * Imports a watch list from a JSON string or parsed data structure.
 * Supports 'merge' (default) or 'replace' mode.
 */
export function importWatches(
  data: string | unknown,
  mode: "merge" | "replace" = "merge",
  storage: StorageLike | null = getStorage(),
): ImportWatchesResult {
  let parsed: unknown;
  if (typeof data === "string") {
    try {
      parsed = JSON.parse(data);
    } catch {
      return {
        success: false,
        count: 0,
        error: "Invalid JSON format in watch list file.",
      };
    }
  } else {
    parsed = data;
  }

  if (!Array.isArray(parsed)) {
    return {
      success: false,
      count: 0,
      error: "Invalid watch list file: expected a JSON array.",
    };
  }

  const importedEntries: WatchEntry[] = [];
  const seen = new Set<string>();
  for (const item of parsed) {
    const entry = toEntry(item);
    if (entry && !seen.has(entry.address)) {
      seen.add(entry.address);
      importedEntries.push(entry);
    }
  }

  if (parsed.length > 0 && importedEntries.length === 0) {
    return {
      success: false,
      count: 0,
      error: "Invalid watch list file: contains no valid Stellar address entries.",
    };
  }

  let nextEntries: WatchEntry[];
  if (mode === "replace") {
    nextEntries = importedEntries.slice(0, MAX_WATCHES);
  } else {
    const current = load(storage);
    const map = new Map<string, WatchEntry>();
    for (const entry of current) {
      map.set(entry.address, entry);
    }
    for (const entry of importedEntries) {
      if (!map.has(entry.address)) {
        map.set(entry.address, entry);
      }
    }
    nextEntries = Array.from(map.values()).slice(0, MAX_WATCHES);
  }

  persist(nextEntries, storage);
  return {
    success: true,
    count: nextEntries.length,
  };
}

