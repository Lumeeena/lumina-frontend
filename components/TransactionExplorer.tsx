"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import { gqlFetch, PUBLIC_GRAPHQL_URL } from "@/lib/graphql";
import type { Transaction } from "@/lib/types";
import {
  EMPTY_FILTERS,
  applyFilters,
  filtersFromQueryString,
  filtersToQueryString,
  isEmptyFilters,
  type TransactionFilters as Filters,
} from "@/lib/transactionFilters";
import { deletePreset, loadPresets, savePreset, type FilterPreset } from "@/lib/filterPresets";
import TransactionFilters from "./TransactionFilters";
import TransactionRow from "./TransactionRow";

const PAGE_QUERY = `
  query TransactionPage($limit: Int, $cursor: String) {
    transactions(limit: $limit, cursor: $cursor) {
      items {
        hash
        ledger
        createdAt
        sourceAccount
        feeCharged
        operationCount
        successful
      }
      pageInfo {
        hasNextPage
        cursor
      }
    }
  }
`;

interface TransactionPage {
  transactions: {
    items: Transaction[];
    pageInfo: { hasNextPage: boolean; cursor: string | null };
  };
}

export const PAGE_SIZE = 50;
const ROW_HEIGHT = 41;
/** Rows rendered beyond the viewport, so a fast scroll does not show gaps. */
const OVERSCAN = 12;

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

const th = "text-left text-[11px] tracking-[0.06em] uppercase text-[#a6a3b0] px-3 py-2.5 border-b border-[#e5e3ea] bg-[#fafafa]";

export default function TransactionExplorer({ initial }: { initial?: Transaction[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [txs, setTxs] = useState<Transaction[]>(initial ?? []);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [presets, setPresets] = useState<FilterPreset[]>([]);

  // The URL is the source of truth for filters, so a refresh, a back button
  // and a pasted link all land on the same view.
  const filters = useMemo(
    () => filtersFromQueryString(searchParams.toString()),
    [searchParams],
  );

  const setFilters = useCallback(
    (next: Filters) => {
      const query = filtersToQueryString(next);
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  // Presets live in localStorage, which does not exist during the server pass.
  useEffect(() => {
    setPresets(loadPresets());
  }, []);

  const loadedHashes = useRef(new Set<string>());
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const data = await gqlFetch<TransactionPage>(PUBLIC_GRAPHQL_URL, PAGE_QUERY, {
        limit: PAGE_SIZE,
        cursor,
      });
      const page = data.transactions;

      setTxs(current => {
        const seen = loadedHashes.current;
        for (const tx of current) seen.add(tx.hash);
        // A cursor page can overlap the previous one when new transactions
        // arrive between requests; duplicates would break React keys.
        const fresh = page.items.filter(tx => !seen.has(tx.hash));
        for (const tx of fresh) seen.add(tx.hash);
        return current.concat(fresh);
      });
      setCursor(page.pageInfo.cursor);
      setHasNextPage(page.pageInfo.hasNextPage && page.pageInfo.cursor !== null);
    } catch {
      setError("Could not load more transactions.");
      // Stop the sentinel from immediately retrying in a tight loop; the
      // explicit retry button puts the user back in control.
      setHasNextPage(false);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [cursor]);

  // First page. `initial` is server-rendered, so only fetch when there is none.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!initial || initial.length === 0) void loadMore();
    else for (const tx of initial) loadedHashes.current.add(tx.hash);
  }, [initial, loadMore]);

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
  const filterKey = filtersToQueryString(filters);
  useEffect(() => {
    autoPages.current = 0;
  }, [filterKey]);

  // ── Virtualization ──────────────────────────────────────────────────────

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  // Spacer rows stand in for everything above and below the rendered window,
  // so the scrollbar reflects the whole list without the DOM holding it.
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom = virtualRows.length > 0 ? totalSize - virtualRows[virtualRows.length - 1].end : 0;

  // ── Infinite scroll ─────────────────────────────────────────────────────

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage) return;
    // jsdom and older browsers have no IntersectionObserver; the explicit
    // "Load more" button below is the fallback, so this is not required.
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) void loadMore();
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
  const handleDeletePreset = useCallback((name: string) => setPresets(deletePreset(name)), []);
  const handleApplyPreset = useCallback((preset: FilterPreset) => setFilters(preset.filters), [setFilters]);

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

      <div className="flex items-center justify-between mb-3 text-[13px] text-[#6b6975]">
        <span data-testid="result-count">
          {filtering
            ? `${filtered.length} of ${txs.length} loaded`
            : `${txs.length} loaded`}
        </span>
        {loading && <span className="text-[#a6a3b0] animate-pulse">Loading&hellip;</span>}
      </div>

      <div
        ref={scrollRef}
        data-testid="transaction-scroll"
        className="rounded-xl border border-[#e5e3ea] overflow-auto max-h-[70vh]"
      >
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className={`${th} w-6`} />
              <th className={th}>Hash</th>
              <th className={th}>Ledger</th>
              <th className={th}>Source</th>
              <th className={th}>Ops</th>
              <th className={th}>Fee</th>
              <th className={th}>Time</th>
            </tr>
          </thead>
          <tbody>
            {paddingTop > 0 && (
              <tr aria-hidden="true">
                <td colSpan={7} style={{ height: paddingTop }} />
              </tr>
            )}
            {virtualRows.map(virtualRow => (
              <TransactionRow key={filtered[virtualRow.index].hash} tx={filtered[virtualRow.index]} />
            ))}
            {paddingBottom > 0 && (
              <tr aria-hidden="true">
                <td colSpan={7} style={{ height: paddingBottom }} />
              </tr>
            )}
          </tbody>
        </table>

        {filtered.length === 0 && !loading && (
          <div className="p-8 text-center text-[#a6a3b0] text-sm">
            {txs.length === 0
              ? "No transactions indexed yet."
              : "No transactions match these filters."}
          </div>
        )}

        <div ref={sentinelRef} data-testid="scroll-sentinel" className="h-px" />
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
        {error ? (
          <>
            <span className="text-[13px] text-[#dc2626]">{error}</span>
            <button
              type="button"
              onClick={() => {
                setHasNextPage(true);
                void loadMore();
              }}
              className="bg-[#f6f5f8] border border-[#e5e3ea] hover:border-[#c4b5fd] font-semibold text-[13px] px-4 py-2 rounded-[9px] transition-colors"
            >
              Retry
            </button>
          </>
        ) : hasNextPage ? (
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loading}
            className="bg-[#f6f5f8] border border-[#e5e3ea] enabled:hover:border-[#c4b5fd] disabled:opacity-50 font-semibold text-[13px] px-5 py-2 rounded-[9px] transition-colors"
          >
            {loading ? "Loading…" : "Load more"}
          </button>
        ) : (
          txs.length > 0 && <span className="text-[13px] text-[#c3c1cb]">End of results</span>
        )}
      </div>
    </>
  );
}

export { EMPTY_FILTERS };
