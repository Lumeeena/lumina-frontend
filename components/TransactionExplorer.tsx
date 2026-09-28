"use client";

import { TransactionPageDocument as PAGE_QUERY } from "@/lib/generated/graphql";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import VirtualizedTransactionTable from "./VirtualizedTransactionTable";
import { gqlFetch, PUBLIC_GRAPHQL_URL } from "@/lib/graphql";
import { useAbortScope } from "@/lib/useAbortScope";
import type { Transaction } from "@/lib/types";
import {
  loadExplorerSnapshot,
  saveExplorerSnapshot,
  type ExplorerSnapshot,
} from "@/lib/explorerSnapshot";
import {
  EMPTY_FILTERS,
  applyFilters,
  filtersFromQueryString,
  filtersToQueryString,
  isEmptyFilters,
  type TransactionFilters as Filters,
} from "@/lib/transactionFilters";
import {
  deletePreset,
  loadPresets,
  savePreset,
  type FilterPreset,
} from "@/lib/filterPresets";
import TransactionFilters from "./TransactionFilters";
import BackendUnavailable from "./BackendUnavailable";

export const PAGE_SIZE = 50;

/**
 * How many filtered matches to chase before stopping.
 *
 * The API paginates but cannot filter — filtering happens over what has been
 * loaded. Without this, switching to "failed" on a page of successes shows an
 * empty table even though page two is full of them, which reads as "no
 * results" rather than "not loaded yet". So an active filter keeps pulling
 * pages until it has something worth showing, or the cursor runs out.
 */
const MIN_FILTERED_ROWS = 20;
/** Ceiling on that chase, so a filter matching nothing cannot walk the chain forever. */
const MAX_AUTO_PAGES = 5;

/**
 * Debounce for writing the scroll offset. A scroll fires continuously and a
 * snapshot holds every loaded row, so serializing it on each one would cost
 * more than it saves.
 */
const SNAPSHOT_SAVE_DELAY_MS = 150;

export default function TransactionExplorer({
  initial,
}: {
  initial?: Transaction[];
}) {
  "use memo";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [txs, setTxs] = useState<Transaction[]>(initial ?? []);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  // Offset read back from this view's snapshot, handed to the table, which
  // re-applies it once the virtualized rows exist to scroll against.
  const [restoredScrollTop, setRestoredScrollTop] = useState(0);
  const loadedHashes = useRef(new Set<string>());
  const loadingRef = useRef(false);
  const requestControllerRef = useRef<AbortController | null>(null);

  // The URL is the source of truth for filters, so a refresh, a back button
  // and a pasted link all land on the same view.
  const filters = useMemo(
    () => filtersFromQueryString(searchParams.toString()),
    [searchParams],
  );
  const filterKey = useMemo(() => filtersToQueryString(filters), [filters]);

  const setFilters = useCallback(
    (next: Filters) => {
      // A changed filter makes an auto-page chase obsolete. Aborting it lets
      // the next filter start its own request as soon as this one settles.
      requestControllerRef.current?.abort();
      const query = filtersToQueryString(next);
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router],
  );

  // Presets live in localStorage, which does not exist during the server pass.
  useEffect(() => {
    // Hydrate browser-only storage after SSR; this intentionally needs one update.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPresets(loadPresets());
  }, []);

  useEffect(
    () => () => requestControllerRef.current?.abort(),
    [],
  );

  // Key this view's snapshot is stored under. Kept in step with the filters on
  // screen, so narrowing the list re-keys the saved view rather than
  // overwriting the unfiltered one with a filtered offset.
  const snapshotKeyRef = useRef<string>(filterKey);
  useEffect(() => {
    snapshotKeyRef.current = filterKey;
  }, [filterKey]);

  // Everything worth restoring, held in one ref so the scroll handler and the
  // unmount flush below can save the current view without re-subscribing.
  const latestRef = useRef<ExplorerSnapshot>({
    txs: initial ?? [],
    cursor: null,
    hasNextPage: true,
    scrollTop: 0,
  });
  const saveTimerRef = useRef<number | null>(null);

  const scheduleSnapshotSave = useCallback(() => {
    if (saveTimerRef.current !== null) return;
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      saveExplorerSnapshot(snapshotKeyRef.current, latestRef.current);
    }, SNAPSHOT_SAVE_DELAY_MS);
  }, []);

  const handleScrollTopChange = useCallback(
    (scrollTop: number) => {
      latestRef.current = { ...latestRef.current, scrollTop };
      scheduleSnapshotSave();
    },
    [scheduleSnapshotSave],
  );

  // The list's fetches live as long as this component does: navigating away
  // cancels a page that is still on its way.
  const scope = useAbortScope();

  const loadMore = useCallback(() => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    const controller = new AbortController();
    requestControllerRef.current = controller;
    setLoading(true);
    setError(null);

    // Supersedes any page still in flight: leaving the page mid-request must
    // not let that request land afterwards and write into state.
    const req = scope.next();

    return gqlFetch(
      PUBLIC_GRAPHQL_URL,
      PAGE_QUERY,
      { limit: PAGE_SIZE, cursor },
      { signal: req.signal },
    )
      .then((data) => {
        if (!req.isCurrent()) return;
        const page = data.transactions;

        setTxs((current) => {
          const seen = loadedHashes.current;
          for (const tx of current) seen.add(tx.hash);
          // A cursor page can overlap the previous one when new transactions
          // arrive between requests; duplicates would break React keys.
          const fresh = page.items.filter((tx) => !seen.has(tx.hash));
          for (const tx of fresh) seen.add(tx.hash);
          return current.concat(fresh);
        });
        setCursor(page.pageInfo.cursor);
        setHasNextPage(
          page.pageInfo.hasNextPage && page.pageInfo.cursor !== null,
        );
      })
      .catch(() => {
        if (!req.isCurrent()) return;
        setError("Could not load more transactions.");
        // Stop the sentinel from immediately retrying in a tight loop; the
        // explicit retry button puts the user back in control.
        setHasNextPage(false);
      })
      .finally(() => {
        // The spinner resolves however the request ended — a cancelled one
        // settles immediately — but only this request's data is ever applied.
        loadingRef.current = false;
        setLoading(false);
      });
  }, [scope, cursor]);

  // ── Return to where the reader was ──────────────────────────────────────
  //
  // A cursor is only meaningful against the rows it produced, so the loaded
  // pages and the offset have to come back together. Restoring only the offset
  // would land the reader at the top of page one, which is the bug this is
  // here to fix.
  const bootstrapped = useRef(false);
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    const snapshot = loadExplorerSnapshot(
      filtersToQueryString(filtersFromQueryString(searchParams.toString())),
    );
    if (snapshot && snapshot.txs.length > 0) {
      for (const tx of snapshot.txs) loadedHashes.current.add(tx.hash);
      latestRef.current = snapshot;
      // sessionStorage does not exist during the server pass, so this cannot be
      // the `useState` initial value without the first client render
      // disagreeing with the server's HTML. One update on mount is the point.
      /* eslint-disable react-hooks/set-state-in-effect -- post-hydration restore, see above */
      setTxs(snapshot.txs);
      setCursor(snapshot.cursor);
      setHasNextPage(snapshot.hasNextPage);
      setRestoredScrollTop(snapshot.scrollTop);
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }

    // Nothing to restore: `initial` is server-rendered, so only fetch when
    // there is none.
    if (initial && initial.length > 0) {
      for (const tx of initial) loadedHashes.current.add(tx.hash);
    } else {
      void loadMore();
    }
  }, [initial, loadMore, searchParams]);

  // Keep the stored view in step with the rows on screen, so a page loaded now
  // is part of what come-back restores.
  useEffect(() => {
    latestRef.current = { ...latestRef.current, txs, cursor, hasNextPage };
    if (txs.length === 0) return;
    saveExplorerSnapshot(snapshotKeyRef.current, latestRef.current);
  }, [txs, cursor, hasNextPage]);

  // Leaving the page is the moment the offset matters most and the last scroll
  // event may still be sitting in the debounce, so flush it on the way out.
  useEffect(
    () => () => {
      if (saveTimerRef.current === null) return;
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
      saveExplorerSnapshot(snapshotKeyRef.current, latestRef.current);
    },
    [],
  );

  useEffect(() => {
    const retry = () => { if (error || txs.length === 0) void loadMore(); };
    window.addEventListener("lumina:online", retry);
    return () => window.removeEventListener("lumina:online", retry);
  }, [error, txs.length, loadMore]);

  const filtered = useMemo(() => applyFilters(txs, filters), [txs, filters]);

  // Chase more pages when a filter has thinned the result set out.
  const autoPages = useRef(0);
  useEffect(() => {
    if (isEmptyFilters(filters)) {
      autoPages.current = 0;
      return;
    }
    if (loading || !hasNextPage) return;
    if (filtered.length >= MIN_FILTERED_ROWS) return;
    if (autoPages.current >= MAX_AUTO_PAGES) return;
    autoPages.current += 1;
    void loadMore();
  }, [filters, filtered.length, hasNextPage, loading, loadMore]);

  // Reset the chase budget whenever the filter itself changes.
  useEffect(() => {
    autoPages.current = 0;
  }, [filterKey]);

  // ── Infinite scroll ─────────────────────────────────────────────────────

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage) return;
    // jsdom and older browsers have no IntersectionObserver; the explicit
    // "Load more" button below is the fallback, so this is not required.
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore();
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, loadMore]);

  // ── Presets ─────────────────────────────────────────────────────────────

  const handleSavePreset = useCallback(
    (name: string) => setPresets(savePreset(name, filters)),
    [filters],
  );
  const handleDeletePreset = useCallback(
    (name: string) => setPresets(deletePreset(name)),
    [],
  );
  const handleApplyPreset = useCallback(
    (preset: FilterPreset) => setFilters(preset.filters),
    [setFilters],
  );

  const filtering = !isEmptyFilters(filters);

  return (
    <>
      <TransactionFilters
        filters={filters}
        onChange={setFilters}
        presets={presets}
        onSavePreset={handleSavePreset}
        onApplyPreset={handleApplyPreset}
        onDeletePreset={handleDeletePreset}
      />

      <div className="flex items-center justify-between mb-3 text-[13px] text-[var(--color-text-secondary)]">
        <span data-testid="result-count">
          {filtering
            ? `${filtered.length} of ${txs.length} loaded`
            : `${txs.length} loaded`}
        </span>
        {loading && (
          <span className="text-[var(--color-text-muted)] animate-pulse">Loading&hellip;</span>
        )}
      </div>

      <VirtualizedTransactionTable
        transactions={filtered}
        emptyMessage={
          !loading && !error
            ? txs.length === 0
              ? "No transactions indexed yet."
              : "No transactions match these filters."
            : null
        }
        initialScrollTop={restoredScrollTop}
        onScrollTopChange={handleScrollTopChange}
      >
        <div ref={sentinelRef} data-testid="scroll-sentinel" className="h-px" />
      </VirtualizedTransactionTable>

      <div className="mt-4 flex items-center justify-center gap-3">
        {error && txs.length === 0 ? (
          <BackendUnavailable onRetry={() => { setHasNextPage(true); void loadMore(); }} />
        ) : error ? (
          <>
            <span className="text-[13px] text-[var(--color-error-text)]">{error}</span>
            <button
              type="button"
              onClick={() => {
                setHasNextPage(true);
                void loadMore();
              }}
              className="bg-[var(--color-bg-raised)] border border-[var(--color-border-default)] hover:border-[var(--color-border-strong)] font-semibold text-[13px] px-4 py-2 rounded-[9px] transition-colors"
            >
              Retry
            </button>
          </>
        ) : hasNextPage ? (
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loading}
            className="bg-[var(--color-bg-raised)] border border-[var(--color-border-default)] enabled:hover:border-[var(--color-border-strong)] disabled:opacity-50 font-semibold text-[13px] px-5 py-2 rounded-[9px] transition-colors"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        ) : (
          txs.length > 0 && (
            <span className="text-[13px] text-[var(--color-text-faint)]">End of results</span>
          )
        )}
      </div>
    </>
  );
}

export { EMPTY_FILTERS };
