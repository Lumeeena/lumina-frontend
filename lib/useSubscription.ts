"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  SubscriptionClient,
  deriveWebSocketUrl,
  type ConnectionState,
} from "./subscriptions";
import { PUBLIC_GRAPHQL_URL } from "./graphql";

/**
 * Where subscriptions connect.
 *
 * Defaults to the GraphQL endpoint with its scheme swapped, because a
 * deployment almost always serves both from the same origin and path. Set
 * `NEXT_PUBLIC_GRAPHQL_WS_URL` when they differ.
 */
export const PUBLIC_GRAPHQL_WS_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_WS_URL ?? deriveWebSocketUrl(PUBLIC_GRAPHQL_URL);

let shared: SubscriptionClient | null = null;

/**
 * One client for the whole tab.
 *
 * Every component that subscribes shares a single socket — two live panels on
 * one page should not mean two connections, two reconnect loops, and two
 * independent opinions about whether the server is reachable.
 *
 * Created lazily so importing this module during a server render never touches
 * `WebSocket`.
 */
export function getSubscriptionClient(): SubscriptionClient {
  if (!shared) {
    shared = new SubscriptionClient({ url: PUBLIC_GRAPHQL_WS_URL });
  }
  return shared;
}

/** Test seam: swap in a client with an injected socket, or reset to default. */
export function __setSubscriptionClient(client: SubscriptionClient | null): void {
  shared = client;
}

export interface UseSubscriptionResult<T> {
  /** Most recent payload, or `null` before the first message arrives. */
  latest: T | null;
  state: ConnectionState;
  error: Error | null;
}

/**
 * Subscribe for as long as the component is mounted.
 *
 * `onData` is held in a ref rather than being a dependency of the effect, so a
 * caller passing an inline arrow function does not tear down and re-open the
 * subscription on every render.
 */
export function useSubscription<T>(
  query: string,
  variables: Record<string, unknown> | undefined,
  onData?: (data: T) => void,
): UseSubscriptionResult<T> {
  const client = getSubscriptionClient();
  const [latest, setLatest] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // The client is an external store, so React should read it as one rather
  // than have the effect mirror it into local state — that mirroring is what
  // makes a subscribed component render twice and drift for a frame.
  const state = useSyncExternalStore<ConnectionState>(
    useCallback(notify => client.onStateChange(notify), [client]),
    useCallback(() => client.getState(), [client]),
    // No socket exists during a server render.
    useCallback(() => "idle" as ConnectionState, []),
  );

  // Held in a ref, and written after commit rather than during render, so a
  // caller passing an inline arrow does not tear down the subscription on
  // every render.
  const onDataRef = useRef(onData);
  useEffect(() => {
    onDataRef.current = onData;
  });

  // Variables are compared by value: callers build them inline, so a reference
  // comparison would resubscribe on every render.
  const variablesKey = JSON.stringify(variables ?? null);

  useEffect(() => {
    const parsed = variablesKey === "null" ? undefined : (JSON.parse(variablesKey) as Record<string, unknown>);

    const stop = client.subscribe<T>(query, parsed, {
      onData: data => {
        setLatest(data);
        setError(null);
        onDataRef.current?.(data);
      },
      onError: setError,
    });

    return stop;
  }, [client, query, variablesKey]);

  return { latest, state, error };
}
