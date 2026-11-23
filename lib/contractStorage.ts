/**
 * Filters for the contract storage browser (`/contracts/[contractId]`).
 *
 * The filters live in the URL (`?keyPrefix=`, `?durability=`) so a shared link
 * reproduces the view the sender saw, and pagination keeps them. Parsing is
 * pure so the rules are tested without a router or a backend.
 */

export const STORAGE_DURABILITIES = ["PERSISTENT", "TEMPORARY"] as const;
export type StorageDurability = (typeof STORAGE_DURABILITIES)[number];

export interface StorageFilters {
  /** Base64 XDR prefix of the ledger key, as the backend matches it. */
  keyPrefix?: string;
  durability?: StorageDurability;
}

export interface ParsedStorageFilters extends StorageFilters {
  /**
   * Set when `keyPrefix` was supplied but is not base64, so the page can say
   * why nothing is filtered rather than silently showing every entry.
   */
  invalidKeyPrefix: boolean;
}

type SearchParams = Record<string, string | string[] | undefined>;

// Ledger keys are base64 XDR, so a prefix that is not base64 can never match.
const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

function firstValue(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() ?? "";
}

export function parseStorageFilters(params: SearchParams): ParsedStorageFilters {
  const rawPrefix = firstValue(params.keyPrefix);
  const rawDurability = firstValue(params.durability).toUpperCase();

  const invalidKeyPrefix = rawPrefix !== "" && !BASE64_PATTERN.test(rawPrefix);
  const keyPrefix = rawPrefix && !invalidKeyPrefix ? rawPrefix : undefined;

  const durability = (STORAGE_DURABILITIES as readonly string[]).includes(
    rawDurability,
  )
    ? (rawDurability as StorageDurability)
    : undefined;

  return { keyPrefix, durability, invalidKeyPrefix };
}

/**
 * Link to a page of the storage browser. Every link carries the active filters,
 * so paging through a filtered list does not drop the filter.
 */
export function storageHref(
  contractId: string,
  filters: StorageFilters,
  cursor?: string | null,
): string {
  const query = new URLSearchParams();
  if (filters.keyPrefix) query.set("keyPrefix", filters.keyPrefix);
  if (filters.durability) query.set("durability", filters.durability);
  if (cursor) query.set("storageCursor", cursor);
  const search = query.toString();
  return `/contracts/${encodeURIComponent(contractId)}${search ? `?${search}` : ""}`;
}
