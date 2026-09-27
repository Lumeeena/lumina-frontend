/**
 * Watch list — a localStorage-backed set of Stellar addresses the user wants
 * to track.  Part of #9 / #85.
 *
 * The storage format is a plain JSON array of address strings.  Simple enough
 * that a corrupt entry is just dropped rather than crashing the page.
 */

export const WATCHES_STORAGE_KEY = 'lumina.watchedAddresses';

/** The slice of localStorage this module uses, injectable for tests. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function getStorage(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function load(storage: StorageLike | null): string[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(WATCHES_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
  } catch {
    return [];
  }
}

function persist(addresses: string[], storage: StorageLike | null): void {
  if (!storage) return;
  try {
    storage.setItem(WATCHES_STORAGE_KEY, JSON.stringify(addresses));
  } catch {
    // Quota full or blocked — silently ignore.
  }
}

export function loadWatches(storage: StorageLike | null = getStorage()): string[] {
  return load(storage);
}

export function isWatched(address: string, storage: StorageLike | null = getStorage()): boolean {
  return load(storage).includes(address);
}

/** Adds the address to the watch list. No-op if already present. */
export function addWatch(address: string, storage: StorageLike | null = getStorage()): string[] {
  const current = load(storage);
  if (current.includes(address)) return current;
  const next = [...current, address];
  persist(next, storage);
  return next;
}

/** Removes the address from the watch list. No-op if not present. */
export function removeWatch(address: string, storage: StorageLike | null = getStorage()): string[] {
  const current = load(storage);
  const next = current.filter((a) => a !== address);
  persist(next, storage);
  return next;
}

/** Toggles the watch state; returns the new state (true = now watched). */
export function toggleWatch(address: string, storage: StorageLike | null = getStorage()): boolean {
  if (isWatched(address, storage)) {
    removeWatch(address, storage);
    return false;
  } else {
    addWatch(address, storage);
    return true;
  }
}
