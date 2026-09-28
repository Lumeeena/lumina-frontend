"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

/** One request, from the moment it starts to the moment it stops being believed. */
export interface AbortHandle {
  /** Hand this to the request so the transport can cancel it. */
  readonly signal: AbortSignal;
  /** Whether an answer to *this* request is still the one the UI should show. */
  isCurrent(): boolean;
}

export interface AbortScope {
  /**
   * Start the request this scope should believe in: whatever is already in
   * flight is superseded — aborted, and ignored even if its answer lands
   * anyway — so a slow response can never overwrite a newer one.
   */
  next(): AbortHandle;
}

/**
 * Cancels a component's in-flight requests when it stops being interested in
 * them. Every request a component starts gets a signal from one of these, so:
 *
 * - `next()` supersedes the previous request — out-of-order answers are
 *   cancelled, and their `isCurrent()` says no even when they arrive first;
 * - a `key` (the inputs a request is made with: an address, an account) aborts
 *   it when those inputs change;
 * - unmounting aborts whatever is left.
 *
 * Teardown waits a microtask before firing. React StrictMode — on for the app
 * router by default — unmounts and immediately remounts every effect in
 * development, and the component, with whatever it already has in flight, is
 * still there: a request started by a mount-once effect would otherwise be
 * cancelled and never retried, because the effect is deliberately not re-run.
 */
export function useAbortScope(key?: string | number | null): AbortScope {
  const controllerRef = useRef<AbortController | null>(null);
  // The teardown an effect pass scheduled, held so the next pass can answer it.
  const teardownRef = useRef<{
    controller: AbortController;
    key?: string | number | null;
  } | null>(null);

  const next = useCallback(() => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    return {
      signal: controller.signal,
      isCurrent: () => controllerRef.current === controller,
    };
  }, []);

  useEffect(() => {
    const teardown = teardownRef.current;
    teardownRef.current = null;
    if (teardown && teardown.key !== key) {
      // Not a StrictMode round trip: the inputs changed instead, and the
      // in-flight request was made for the previous ones.
      teardown.controller.abort();
      if (controllerRef.current === teardown.controller) {
        controllerRef.current = null;
      }
    }

    return () => {
      const controller = controllerRef.current;
      if (!controller) return;
      teardownRef.current = { controller, key };
      queueMicrotask(() => {
        // The next effect pass, if there is one, has already claimed this
        // teardown — which means the component is still mounted.
        if (teardownRef.current?.controller !== controller) return;
        teardownRef.current = null;
        controller.abort();
        if (controllerRef.current === controller) {
          controllerRef.current = null;
        }
      });
    };
  }, [key]);

  return useMemo(() => ({ next }), [next]);
}
