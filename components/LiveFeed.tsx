"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Pause, Play } from "lucide-react";
import { gqlFetch, PUBLIC_GRAPHQL_URL } from "@/lib/graphql";
import { useSubscription } from "@/lib/useSubscription";
import type { Transaction } from "@/lib/types";
import { truncateAddress, timeAgo } from "@/lib/formatters";
import ConnectionIndicator from "./ConnectionIndicator";

const TRANSACTION_FIELDS = `
  hash
  ledger
  createdAt
  sourceAccount
  feeCharged
  operationCount
  successful
`;

const RECENT_TRANSACTIONS_QUERY = `
  query LiveFeedTransactions($limit: Int) {
    transactions(limit: $limit) {
      items {${TRANSACTION_FIELDS}}
    }
  }
`;

const NEW_TRANSACTION_SUBSCRIPTION = `
  subscription LiveFeedNewTransaction {
    newTransaction {${TRANSACTION_FIELDS}}
  }
`;

/**
 * How many transactions the feed keeps.
 *
 * A subscription-backed list grows forever on a tab left open overnight, so it
 * is capped — this is a "what's happening now" panel, not a scrollback buffer.
 */
export const MAX_FEED_LENGTH = 25;

/** Interval used only when the live connection is unavailable. */
export const FALLBACK_POLL_MS = 30_000;

/** The initial page, so the feed is not empty until the first push arrives. */
const SEED_LIMIT = 10;
const ROW_HEIGHT = 43;
const OVERSCAN = 3;

export default function LiveFeed() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [resumedCount, setResumedCount] = useState(0);
  const pausedRef = useRef(false);
  const txsRef = useRef<Transaction[]>([]);
  const queuedRef = useRef<Transaction[]>([]);
  const seenWhilePausedRef = useRef(new Set<string>());

  useEffect(() => {
    txsRef.current = txs;
  }, [txs]);

  const pauseFeed = useCallback(() => {
    pausedRef.current = true;
    setPaused(true);
    setResumedCount(0);
  }, []);

  const resumeFeed = useCallback(() => {
    const queued = queuedRef.current;
    const arrived = pendingCount;

    pausedRef.current = false;
    queuedRef.current = [];
    seenWhilePausedRef.current.clear();
    setPaused(false);
    setPendingCount(0);
    setResumedCount(arrived);

    if (queued.length === 0) return;
    setTxs(current => {
      const seen = new Set<string>();
      const merged = [...queued, ...current].filter(tx => {
        if (seen.has(tx.hash)) return false;
        seen.add(tx.hash);
        return true;
      });
      return merged.slice(0, MAX_FEED_LENGTH);
    });
    setLastUpdated(new Date());
  }, [pendingCount]);

  const prependTransaction = useCallback((tx: Transaction) => {
    if (pausedRef.current) {
      if (txsRef.current.some(existing => existing.hash === tx.hash)) return;
      if (seenWhilePausedRef.current.has(tx.hash)) return;

      seenWhilePausedRef.current.add(tx.hash);
      queuedRef.current = [tx, ...queuedRef.current].slice(0, MAX_FEED_LENGTH);
      setPendingCount(count => count + 1);
      return;
    }

    setTxs(current => {
      // The server may replay an item across a reconnect; a hash already at the
      // top must not appear twice.
      if (current.some(existing => existing.hash === tx.hash)) return current;
      return [tx, ...current].slice(0, MAX_FEED_LENGTH);
    });
    setLastUpdated(new Date());
  }, []);

  const { state, failureReason, retry } = useSubscription<{ newTransaction: Transaction }>(
    NEW_TRANSACTION_SUBSCRIPTION,
    undefined,
    useCallback(
      (data: { newTransaction: Transaction }) => {
        if (data?.newTransaction) prependTransaction(data.newTransaction);
      },
      [prependTransaction],
    ),
  );

  const live = state === "connected" || state === "connecting" || state === "reconnecting";

  const fetchRecent = useCallback(async () => {
    try {
      const data = await gqlFetch<{ transactions: { items: Transaction[] } }>(
        PUBLIC_GRAPHQL_URL,
        RECENT_TRANSACTIONS_QUERY,
        { limit: SEED_LIMIT },
      );
      if (data.transactions.items.length > 0) {
        setTxs(data.transactions.items.slice(0, MAX_FEED_LENGTH));
        setLastUpdated(new Date());
      }
    } catch {
      // Keep showing the last successful fetch rather than blanking the panel.
    }
    setLoading(false);
  }, []);

  // Seed once on mount. Without this the feed is empty until the network
  // happens to produce a transaction, which reads as broken.
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    void fetchRecent();
  }, [fetchRecent]);

  // Fall back to the old polling behaviour only once the client has actually
  // given up — a restrictive proxy or a browser without WebSocket should
  // degrade to a slower feed, not to a dead one.
  useEffect(() => {
    if (live) return;
    const interval = setInterval(() => void fetchRecent(), FALLBACK_POLL_MS);
    return () => clearInterval(interval);
  }, [live, fetchRecent]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const virtualizer = useVirtualizer({
    count: txs.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });
  const virtualRows = virtualizer.getVirtualItems();

  return (
    <div className="rounded-xl border border-[#e5e3ea]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5e3ea] bg-[#fafafa] px-4 py-3">
        <ConnectionIndicator state={state} failureReason={failureReason} onRetry={retry} />
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[0.6875rem] text-[#a6a3b0]">Updated {timeAgo(lastUpdated.toISOString())}</span>
          )}
          <button
            type="button"
            aria-pressed={paused}
            onClick={paused ? resumeFeed : pauseFeed}
            className="relative inline-flex min-h-8 select-none items-center gap-1.5 rounded-lg border border-[#e5e3ea] bg-white py-1.5 pl-1.5 pr-2.5 text-xs font-semibold text-[#6b6975] hover:border-[#c4b5fd] hover:text-[#0e0e12]"
          >
            {paused ? <Play aria-hidden="true" className="size-4 shrink-0" strokeWidth={2} /> : <Pause aria-hidden="true" className="size-4 shrink-0" strokeWidth={2} />}
            {paused ? `Resume feed${pendingCount > 0 ? ` (${pendingCount})` : ""}` : "Pause feed"}
            <span className="absolute left-1/2 top-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {paused
          ? `Live feed paused. ${pendingCount} ${pendingCount === 1 ? "update" : "updates"} waiting.`
          : resumedCount > 0
            ? `Live feed resumed. ${resumedCount} ${resumedCount === 1 ? "update" : "updates"} arrived while paused.`
            : "Live feed running."}
      </div>

      {loading ? (
        <div className="p-6 text-center text-[#a6a3b0] text-sm animate-pulse">Fetching live data...</div>
      ) : txs.length === 0 ? (
        <div className="p-6 text-center text-[#a6a3b0] text-sm">No transactions found.</div>
      ) : (
        <div
          ref={scrollRef}
          role="list"
          aria-label="Live transactions"
          data-testid="live-feed-scroll"
          data-retained-count={txs.length}
          onFocusCapture={pauseFeed}
          onPointerDownCapture={pauseFeed}
          className="max-h-64 overflow-auto"
        >
          <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
            {virtualRows.map(virtualRow => {
              const tx = txs[virtualRow.index];
              return (
                <div
                  key={tx.hash}
                  role="listitem"
                  aria-setsize={txs.length}
                  aria-posinset={virtualRow.index + 1}
                  className="absolute left-0 top-0 flex w-full items-center gap-3 border-b border-[#f0eff3] px-4 py-2.5"
                  style={{ height: ROW_HEIGHT, transform: `translateY(${virtualRow.start}px)` }}
                >
                  <span aria-hidden="true" className={`size-[7px] shrink-0 rounded-full ${tx.successful ? "bg-[#16a34a]" : "bg-[#dc2626]"}`} />
                  <a
                    href={`https://stellar.expert/explorer/public/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={tx.hash}
                    className="mono text-xs text-[#7c3aed] hover:text-[#6d28d9] hover:underline"
                  >
                    {truncateAddress(tx.hash, 5)}
                  </a>
                  <span className="mono hidden min-w-0 text-xs text-[#a6a3b0] sm:inline">{truncateAddress(tx.sourceAccount)}</span>
                  <span className="ml-auto shrink-0 text-[0.6875rem] text-[#c3c1cb]">{timeAgo(tx.createdAt)}</span>
                  <span className="shrink-0 rounded bg-[#f6f5f8] px-1.5 py-0.5 text-[0.6875rem] tabular-nums text-[#6b6975]">{tx.operationCount} ops</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
