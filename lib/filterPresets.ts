import { EMPTY_FILTERS, filtersFromQueryString, filtersToQueryString, type TransactionFilters } from "./transactionFilters";

export interface FilterPreset {
  name: string;
  filters: TransactionFilters;
}

export const PRESETS_STORAGE_KEY = "lumina.transactionFilterPresets";

/** The slice of `localStorage` this module uses, so tests can supply their own. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * Presets are stored as their query-string form rather than as nested JSON.
 *
 * It is the same representation the URL uses, so a preset and a shared link are
 * interchangeable, and a stored preset written by an older version keeps
 * loading when a filter field is added — `filtersFromQueryString` fills in the
 * defaults for anything missing instead of the whole entry failing to parse.
 */
interface StoredPreset {
  name: string;
  query: string;
}

export function getStorage(): StorageLike | null {
  try {
    // Absent during a server render, and throws outright in a browser with
    // site data blocked — both mean "no presets", not "crash the page".
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function loadPresets(storage: StorageLike | null = getStorage()): FilterPreset[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(PRESETS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry): entry is StoredPreset =>
        Boolean(entry) && typeof entry === "object" &&
        typeof (entry as StoredPreset).name === "string" &&
        typeof (entry as StoredPreset).query === "string")
      .map(entry => ({ name: entry.name, filters: filtersFromQueryString(entry.query) }));
  } catch {
    // Corrupt or unreadable storage behaves as no presets rather than
    // breaking the page it is rendered on.
    return [];
  }
}

/** Saving under an existing name overwrites it, matching how "save" reads. */
export function savePreset(
  name: string,
  filters: TransactionFilters,
  storage: StorageLike | null = getStorage(),
): FilterPreset[] {
  const trimmed = name.trim();
  if (!trimmed) return loadPresets(storage);

  const current = loadPresets(storage);
  const next = [...current.filter(preset => preset.name !== trimmed), { name: trimmed, filters }];
  // If it did not persist, report the list as it still is. Showing a preset
  // the next page load will not have is worse than not appearing to save.
  return persist(next, storage) ? next : current;
}

export function deletePreset(name: string, storage: StorageLike | null = getStorage()): FilterPreset[] {
  const current = loadPresets(storage);
  const next = current.filter(preset => preset.name !== name);
  return persist(next, storage) ? next : current;
}

/** Returns whether the write actually landed. */
function persist(presets: FilterPreset[], storage: StorageLike | null): boolean {
  if (!storage) return false;
  try {
    const stored: StoredPreset[] = presets.map(preset => ({
      name: preset.name,
      query: filtersToQueryString(preset.filters),
    }));
    storage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(stored));
    return true;
  } catch {
    // A full or read-only quota should not take the page down with it.
    return false;
  }
}

export { EMPTY_FILTERS };
