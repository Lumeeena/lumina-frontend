"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AccountActivityDocument } from "@/lib/generated/graphql";
import { getSubscriptionClient } from "@/lib/useSubscription";
import type { AccountActivitySubscription } from "@/lib/generated/graphql";
import type { Operation } from "@/lib/types";
import { matchesOperationFilters, type OperationFilters } from "@/lib/operationFilters";
import {
  loadWatches,
  subscribeToWatches,
  type WatchEntry,
} from "@/lib/watches";
import type { ConnectionState, FailureReason } from "@/lib/subscriptions";

/** Cap, for the same reason `LiveFeed` and `AccountActivityFeed` have one. */
export const MAX_ACTIVITY_LENGTH = 100;

export interface WatchActivity {
  /** `${address}:${operationId}` — the same key the notification store uses. */
  id: string;
  address: string;
  operation: Operation;
}

export interface UseWatchedActivityResult {
  activity: WatchActivity[];
  /** The watches behind the feed, with the filter each one alerts on. */
  entries: WatchEntry[];
  state: ConnectionState;
  failureReason: FailureReason | null;
  retry: () => void;
  /** How many watches the feed is subscribed to right now. */
  watching: number;
  /**
   * How many alert-worthy operations have arrived. Separated from `activity`
   * because the feed shows everything and the alert only shows what the watch's
   * filters allow — a watch that alerted on everything would be turned off.
   */
  alertCount: number;
}

/** Keeps the newest callback reachable without making it a render dependency. */
function useLatest<T>(value: T): { current: T } {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}

function idFor(address: string, operation: Operation): string {
  return `${address}:${operation.id}`;
}

/**
 * One feed over every watched address. Part of #9 / #80.
 *
 * The reason this is not N calls to `useSubscription` is the socket count. The
 * subscription client already multiplexes every subscription over a single
 * connection, so subscribing to 20 addresses is 20 `subscribe` frames on 1
 * socket, not 20 sockets — and that is asserted by
 * `lib/useWatchedActivity.test.tsx`, because "one connection per watch" is the
 * failure this issue is named after. The hook subscribes to the shared client
 * directly rather than rendering a `useSubscription` per address, because a hook
 * cannot be called in a loop whose length changes: the watch list is
 * user-controlled and would break the rules of hooks the moment it changed size.
 */
export function useWatchedActivity(
  onAlert?: (activity: WatchActivity) => void,
): UseWatchedActivityResult {
  const [entries, setEntries] = useState<WatchEntry[]>([]);
  const [activity, setActivity] = useState<WatchActivity[]>([]);
  const [alertCount, setAlertCount] = useState(0);
  const onAlertRef = useLatest(onAlert);

  // The watch list lives in localStorage, which does not exist during the server
  // pass, so it is read after hydration and re-read whenever it changes.
  useEffect(() => {
    const sync = () => {
      setEntries((current) => {
        const next = loadWatches();
        // Keep the identity stable when nothing actually changed, so a watch
        // event from an unrelated part of the app does not restart any
        // subscription.
        if (sameEntries(current, next)) return current;
        return next;
      });
    };
    // Hydrate browser-only storage after SSR; this intentionally needs one update.
    sync();
    return subscribeToWatches(sync);
  }, []);

  // Filters are read at delivery time rather than captured when the
  // subscription opens. They do not affect the wire at all, so a filter change
  // should not cost a resubscribe — and the address→filters map here is what
  // makes that possible without re-running the effect below.
  //
  // Updated in an effect, not during render: a render can be thrown away, and a
  // ref left describing a render that never committed would filter the next
  // delivery against a state the user never saw. Declared above the subscribe
  // effect so the two run in order, which means a fresh subscription is never
  // live before its filters are readable.
  const filtersRef = useRef(new Map<string, OperationFilters>());
  useEffect(() => {
    filtersRef.current = new Map(entries.map((entry) => [entry.address, entry.filters]));
  }, [entries]);

  function receive(address: string, operation: Operation | undefined) {
    if (!operation) return;
    // The server filters by address, but the feed is labelled as being about
    // this address — so anything else is dropped rather than shown under a label
    // that would make it wrong.
    if (
      operation.sourceAccount !== address &&
      operation.from !== address &&
      operation.to !== address
    ) {
      return;
    }
    const id = idFor(address, operation);
    setActivity((current) => {
      if (current.some((item) => item.id === id)) return current;
      return [{ id, address, operation }, ...current].slice(0, MAX_ACTIVITY_LENGTH);
    });
    const filters = filtersRef.current.get(address);
    if (filters && matchesOperationFilters(operation, filters)) {
      setAlertCount((count) => count + 1);
      onAlertRef.current?.({ id, address, operation });
    }
  }

  // The query is a constant, so the string is stable for the client's
  // subscription map rather than being rebuilt per address.
  const query = useMemo(() => AccountActivityDocument.toString(), []);

  // One socket carries every subscription, so this effect adds and removes only
  // the addresses that actually changed. Tearing the whole set down and
  // rebuilding it would drop the connection for a second every time a watch is
  // added — which is the churn the issue is about, just moved.
  const activeRef = useRef(new Map<string, () => void>());

  useEffect(() => {
    const client = getSubscriptionClient();
    const active = activeRef.current;
    const wanted = new Set(entries.map((entry) => entry.address));

    for (const [address, stop] of active) {
      if (wanted.has(address)) continue;
      stop();
      active.delete(address);
    }

    for (const entry of entries) {
      if (active.has(entry.address)) continue;
      active.set(
        entry.address,
        client.subscribe<AccountActivitySubscription>(
          query,
          { address: entry.address },
          { onData: (data) => receive(entry.address, data?.accountActivity) },
        ),
      );
    }
    // `receive` is stable via its refs, so it is not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, query]);

  // Teardown is a separate effect on purpose. Returning a cleanup from the
  // effect above would run it before *every* re-run, which is exactly the
  // stop-everything-then-restart churn this avoids — and it would close the
  // socket each time, because the client closes on the last unsubscribe.
  useEffect(
    () => () => {
      const active = activeRef.current;
      for (const stop of active.values()) stop();
      active.clear();
    },
    [],
  );

  // The connection state belongs to the shared client, so it is read as an
  // external store rather than mirrored into local state here — mirroring is
  // what makes a subscribed component render twice and drift for a frame.
  const [state, setState] = useState<ConnectionState>("idle");
  useEffect(() => {
    const client = getSubscriptionClient();
    const read = () => setState(client.getState());
    read();
    return client.onStateChange(read);
  }, [entries.length]);

  const retry = useCallback(() => getSubscriptionClient().retryNow(), []);

  return {
    activity,
    entries,
    state,
    failureReason: getSubscriptionClient().getFailureReason(),
    retry,
    watching: entries.length,
    alertCount,
  };
}

function sameEntries(a: WatchEntry[], b: WatchEntry[]): boolean {
  if (a.length !== b.length) return false;
  return a.every(
    (entry, index) =>
      entry.address === b[index].address &&
      JSON.stringify(entry.filters) === JSON.stringify(b[index].filters),
  );
}
