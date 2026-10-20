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

/**
 * Key used to persist watched address activity notifications in localStorage.
 * Shared across tabs under the same origin.
 */
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

/**
 * Represents an individual notification item displayed in the navigation activity bell.
 * Each notification corresponds to a unique operation detected on a watched address.
 */
export interface ActivityNotification {
  /** `${address}:${operationId}` — the dedupe key, stable across re-renders. */
  id: string;
  /** Stellar address that was watched and produced this activity. */
  address: string;
  /** Protocol operation type (e.g., PAYMENT, INVOKE_HOST_FUNCTION). */
  operationType: string;
  /** 64-character hexadecimal transaction hash containing the operation. */
  transactionHash: string;
  /** Formatted transfer amount, if applicable to the operation type. */
  amount: string | null;
  /** Asset code or symbol transferred, if applicable. */
  asset: string | null;
  /** ISO 8601 timestamp when the ledger containing this operation closed. */
  createdAt: string;
  /** Whether the notification has been acknowledged by the user. */
  read: boolean;
}

/**
 * Storage interface contract required by the notification store.
 * Compatible with the browser's `localStorage` and custom test memory stores.
 */
export interface StorageLike {
  /** Retrieve a string value by key, returning null if missing. */
  getItem(key: string): string | null;
  /** Persist a string value under the specified key. */
  setItem(key: string, value: string): void;
}

function getStorage(): StorageLike | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

/**
 * Computes the deterministic, unique identifier for an address activity event.
 * Combines the address and operation ID into a stable deduplication key.
 *
 * @param address - The watched Stellar address.
 * @param operationId - The unique operation ID emitted by the ledger/GraphQL subscription.
 * @returns Formatted `${address}:${operationId}` identifier.
 */
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

/**
 * Reads notifications from the provided or default localStorage storage.
 * Safely parses the stored JSON, discards malformed entries, and caps at MAX_NOTIFICATIONS.
 *
 * @param storage - Optional custom storage backing (defaults to browser localStorage).
 * @returns Array of validated ActivityNotification items, sorted newest to oldest.
 */
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

/**
 * Marks every notification currently in the store as read.
 * If all notifications are already read, performs a no-op and returns the cached snapshot.
 *
 * @param storage - Optional custom storage backing.
 * @returns Updated array of notifications with all items marked `read: true`.
 */
export function markAllRead(storage?: StorageLike | null): ActivityNotification[] {
  const current = read(storage);
  if (current.every((item) => item.read)) return snapshot(storage, current);
  return write(
    current.map((item) => (item.read ? item : { ...item, read: true })),
    storage ?? getStorage(),
  );
}

/**
 * Removes all notifications from storage and in-memory cache.
 * Broadcasts an update to all external store listeners.
 *
 * @param storage - Optional custom storage backing.
 * @returns An empty array.
 */
export function clearNotifications(
  storage?: StorageLike | null,
): ActivityNotification[] {
  const current = read(storage);
  if (current.length === 0) return snapshot(storage, current);
  return write([], storage ?? getStorage());
}

/**
 * Computes the number of unacknowledged (unread) notifications.
 *
 * @param notifications - Notification list to count (defaults to loading from storage).
 * @returns Count of notifications where `read === false`.
 */
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

/**
 * External store client snapshot getter designed for React's `useSyncExternalStore`.
 * Returns the memoized cache reference to ensure referential stability and prevent render loops.
 *
 * @returns Stable reference to the current notification list.
 */
export function getSnapshot(): ActivityNotification[] {
  return current();
}

/**
 * External store server snapshot getter for React SSR / Server Components.
 * Always returns an empty frozen array since server environments have no localStorage.
 *
 * @returns An empty array reference.
 */
export function getServerSnapshot(): ActivityNotification[] {
  return EMPTY;
}

/**
 * Subscribes a listener callback to notification store mutations.
 * When new notifications arrive, are marked read, or cleared, all subscribers are notified.
 *
 * @param listener - Callback invoked synchronously after store writes.
 * @returns Unsubscribe function to cleanly remove the listener.
 */
export function subscribeToNotifications(listener: () => void): () => void {
  listeners.add(listener);
  // Reading the cache here is what makes a late subscriber see the alerts that
  // arrived while it was still mounting.
  if (cache === null) cache = loadNotifications();
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Test seam: resets the in-memory cache and drops subscriber state so subsequent reads
 * are forced to reload fresh data from storage.
 */
export function __resetNotificationStore(): void {
  cache = null;
}
