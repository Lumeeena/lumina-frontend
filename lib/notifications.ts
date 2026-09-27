/**
 * Unread activity for watched addresses. Part of #9 / #81.
 *
 * A watch that only fires while the page is open is not a watch. This store is
 * what makes the alert independent of where the user is: the subscriptions run
 * in the root layout (`components/WatchActivityWatcher.tsx`), so activity is
 * recorded on every route, and the nav bell reads the same store.
 *
 * Modelled as an external store rather than component state because two
 * unrelated components write and read it — the watcher in the layout and the
 * panel in the nav — and neither is an ancestor of the other. React reads it
 * through `useSyncExternalStore`, so there is exactly one copy of the list.
 *
 * Deliberately free of React, so it is importable from a server component and
 * testable in plain Node.
 */

import type { Operation } from "./types";
import { matchesOperationFilters, type OperationFilters } from "./operationFilters";

export const NOTIFICATIONS_STORAGE_KEY = "lumina.activityNotifications";

/**
 * How many alerts are kept.
 *
 * Bounded because this is a notification tray, not an archive: the panel shows
 * "recent", and a tab left open for a week on a busy address should not grow
 * an unbounded localStorage entry that then fails to write. The oldest are
 * dropped first, so what survives is what someone might still want to read.
 */
export const MAX_NOTIFICATIONS = 50;

export interface ActivityNotification {
  /** `${address}:${operationId}` — the dedupe key, stable across re-renders. */
  id: string;
  address: string;
  operationType: string;
  transactionHash: string;
  amount: string | null;
  asset: string | null;
  createdAt: string;
  read: boolean;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function getStorage(): StorageLike | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function notificationId(address: string, operationId: string): string {
  return `${address}:${operationId}`;
}

function toNotification(value: unknown): ActivityNotification | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.id !== "string" || typeof raw.address !== "string") return null;
  return {
    id: raw.id,
    address: raw.address,
    operationType: typeof raw.operationType === "string" ? raw.operationType : "UNKNOWN",
    transactionHash: typeof raw.transactionHash === "string" ? raw.transactionHash : "",
    amount: typeof raw.amount === "string" ? raw.amount : null,
    asset: typeof raw.asset === "string" ? raw.asset : null,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : "",
    read: raw.read === true,
  };
}

export function loadNotifications(
  storage: StorageLike | null = getStorage(),
): ActivityNotification[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(toNotification)
      .filter((item): item is ActivityNotification => item !== null)
      .slice(0, MAX_NOTIFICATIONS);
  } catch {
    return [];
  }
}

function write(
  next: ActivityNotification[],
  storage: StorageLike | null,
): ActivityNotification[] {
  if (storage) {
    try {
      storage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Quota full or blocked. The in-memory copy still updates, so the tray
      // works for this session even though it will not survive a reload.
    }
  }
  publish(next);
  return next;
}

/**
 * Record one activity item, or return the list unchanged.
 *
 * On the no-op path this returns the cached snapshot rather than a fresh read.
 * That is the whole point: a caller re-rendering on array identity would
 * otherwise loop forever on a duplicate delivery, and duplicates are the normal
 * case rather than an edge case — the server replays every active subscription
 * after a reconnect.
 */
export function recordActivity(
  address: string,
  operation: Operation,
  storage?: StorageLike | null,
): ActivityNotification[] {
  const current = read(storage);
  const id = notificationId(address, operation.id);
  if (current.some((item) => item.id === id)) return snapshot(storage, current);

  const next: ActivityNotification[] = [
    {
      id,
      address,
      operationType: operation.type,
      transactionHash: operation.transactionHash,
      amount: operation.amount ?? null,
      asset: operation.asset ?? null,
      createdAt: operation.createdAt,
      read: false,
    },
    ...current,
  ].slice(0, MAX_NOTIFICATIONS);

  return write(next, storage ?? getStorage());
}

/**
 * Whether this operation should raise an alert for a watch with these filters.
 *
 * Separate from recording so a caller can also show the operation in a feed
 * while *not* alerting on it — the feed is for browsing, the alert is for
 * interrupting, and a watch that alerted on everything would be useless.
 */
export function shouldAlert(
  operation: Operation,
  filters: OperationFilters,
): boolean {
  return matchesOperationFilters(operation, filters);
}

/**
 * The list to operate on.
 *
 * With an explicit `storage` it is read from there, because a caller holding
 * its own slice is entitled to see its own bytes. With the default storage it
 * comes from the cache, so two calls in one tick cannot disagree.
 */
function read(storage?: StorageLike | null): ActivityNotification[] {
  if (storage !== undefined) return loadNotifications(storage);
  return current();
}

/**
 * What a no-op returns.
 *
 * For the real storage this is the cache, which is the store's actual snapshot —
 * the only thing a subscriber can meaningfully compare against. For an injected
 * storage there may be no cache at all, so the fresh read stands; that path is
 * the tests', and identity there carries no meaning.
 */
function snapshot(
  storage: StorageLike | null | undefined,
  fallback: ActivityNotification[],
): ActivityNotification[] {
  if (storage !== undefined) return fallback;
  return current();
}

export function markAllRead(storage?: StorageLike | null): ActivityNotification[] {
  const current = read(storage);
  if (current.every((item) => item.read)) return snapshot(storage, current);
  return write(
    current.map((item) => (item.read ? item : { ...item, read: true })),
    storage ?? getStorage(),
  );
}

export function clearNotifications(
  storage?: StorageLike | null,
): ActivityNotification[] {
  const current = read(storage);
  if (current.length === 0) return snapshot(storage, current);
  return write([], storage ?? getStorage());
}

export function unreadCount(
  notifications: readonly ActivityNotification[] = loadNotifications(),
): number {
  return notifications.reduce((total, item) => (item.read ? total : total + 1), 0);
}

// ─── External store ──────────────────────────────────────────────────────────
//
// `getSnapshot` must return an identical reference between changes or React
// re-renders in a loop, so the list is cached and only replaced on a write.

const EMPTY: ActivityNotification[] = [];

let cache: ActivityNotification[] | null = null;
const listeners = new Set<() => void>();

function publish(next: ActivityNotification[]): void {
  cache = next;
  for (const listener of listeners) listener();
}

function current(): ActivityNotification[] {
  if (cache === null) cache = loadNotifications();
  return cache;
}

export function getSnapshot(): ActivityNotification[] {
  return current();
}

/** A server render has no localStorage, so it must not claim there are alerts. */
export function getServerSnapshot(): ActivityNotification[] {
  return EMPTY;
}

export function subscribeToNotifications(listener: () => void): () => void {
  listeners.add(listener);
  // Reading the cache here is what makes a late subscriber see the alerts that
  // arrived while it was still mounting.
  if (cache === null) cache = loadNotifications();
  return () => {
    listeners.delete(listener);
  };
}

/** Test seam: drop the cache so a later read comes from storage again. */
export function __resetNotificationStore(): void {
  cache = null;
}
