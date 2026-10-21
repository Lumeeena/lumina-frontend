/**
 * Recently viewed entities tracker.
 *
 * Tracks recently viewed accounts, transactions, and contracts locally.
 * Items are stored in localStorage with timestamps and can be retrieved
 * sorted by recency.
 */

export type EntityType = "account" | "transaction" | "contract";

export interface ViewedEntity {
  id: string;
  type: EntityType;
  label: string;
  path: string;
  timestamp: number;
}

export const RECENTLY_VIEWED_KEY = "lumina.recentlyViewed";
export const MAX_ITEMS = 50;

export function readRecentlyViewed(): ViewedEntity[] {
  try {
    const stored = window.localStorage.getItem(RECENTLY_VIEWED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveRecentlyViewed(items: ViewedEntity[]): void {
  try {
    window.localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(items));
  } catch {
    // localStorage not available or full.
  }
}

export function addRecentlyViewed(
  id: string,
  type: EntityType,
  label: string,
  path: string
): void {
  const items = readRecentlyViewed();

  // Remove existing entry if present
  const filtered = items.filter((item) => !(item.id === id && item.type === type));

  // Add to front with current timestamp
  const newItem: ViewedEntity = {
    id,
    type,
    label,
    path,
    timestamp: Date.now(),
  };

  const updated = [newItem, ...filtered].slice(0, MAX_ITEMS);
  saveRecentlyViewed(updated);
}

export function clearRecentlyViewed(): void {
  saveRecentlyViewed([]);
}

export function getRecentlyViewedByType(type: EntityType): ViewedEntity[] {
  return readRecentlyViewed().filter((item) => item.type === type);
}

export function getRecentlyViewed(limit?: number): ViewedEntity[] {
  const items = readRecentlyViewed();
  return limit ? items.slice(0, limit) : items;
}

export function removeRecentlyViewed(id: string, type: EntityType): void {
  const items = readRecentlyViewed();
  const filtered = items.filter((item) => !(item.id === id && item.type === type));
  saveRecentlyViewed(filtered);
}
