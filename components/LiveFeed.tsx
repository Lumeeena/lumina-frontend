"use client";

import { LiveFeedTransactionsDocument as RECENT_TRANSACTIONS_QUERY } from "@/lib/generated/graphql";
import { LiveFeedNewTransactionDocument as NEW_TRANSACTION_SUBSCRIPTION } from "@/lib/generated/graphql";

import { useCallback, useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Pause, Play } from "lucide-react";
import { gqlFetch, PUBLIC_GRAPHQL_URL } from "@/lib/graphql";
import { useSubscription } from "@/lib/useSubscription";
import type { Transaction } from "@/lib/types";
import { truncateAddress } from "@/lib/formatters";
import TimeAgo from "./TimeAgo";
import ConnectionIndicator from "./ConnectionIndicator";

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
    setTxs((current) => {
      // The server may replay an item across a reconnect; a hash already at the
      // top must not appear twice.
      if (current.some((existing) => existing.hash === tx.hash)) return current;
      return [tx, ...current].slice(0, MAX_FEED_LENGTH);
    });
    setLastUpdated(new Date());
  }, []);

  const { state, failureReason, retry } = useSubscription(
    NEW_TRANSACTION_SUBSCRIPTION,
    undefined,
    useCallback(
      (data: { newTransaction: Transaction }) => {
        if (data?.newTransaction) prependTransaction(data.newTransaction);
      },
      [prependTransaction],
    ),
  );

  const live =
    state === "connected" || state === "connecting" || state === "reconnecting";

  const fetchRecent = useCallback(async () => {
    try {
      const data = await gqlFetch(
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

  useEffect(() => {
    const reconnect = () => { void fetchRecent(); retry(); };
    window.addEventListener("lumina:online", reconnect);
    return () => window.removeEventListener("lumina:online", reconnect);
  }, [fetchRecent, retry]);

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
    <div className="rounded-xl border border-[#e5e3ea] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e3ea] bg-[#fafafa]">
        <ConnectionIndicator
          state={state}
          failureReason={failureReason}
          onRetry={retry}
        />
        {lastUpdated && (
          <span className="text-[11px] text-[#a6a3b0]">Updated <TimeAgo isoString={lastUpdated.toISOString()} /></span>
        )}
      </div>

      {loading ? (
        <div className="p-6 text-center text-[#a6a3b0] text-sm animate-pulse">
          Fetching live data...
        </div>
      ) : txs.length === 0 ? (
        <div className="p-6 text-center text-[#a6a3b0] text-sm">
          No transactions found.
        </div>
      ) : (
        <div>
          {txs.map((tx) => (
            <div
              key={tx.hash}
              className="flex items-center gap-3 px-4 py-2.5 border-b border-[#f0eff3] last:border-0"
            >
              <span
                className={`w-[7px] h-[7px] rounded-full shrink-0 ${tx.successful ? "bg-[#16a34a]" : "bg-[#dc2626]"}`}
              />
              <a
                href={`https://stellar.expert/explorer/public/tx/${tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mono text-xs text-[#7c3aed] hover:text-[#6d28d9] hover:underline transition-colors"
              >
                {truncateAddress(tx.hash, 5)}
              </a>
              <span className="text-xs text-[#a6a3b0] mono">{truncateAddress(tx.sourceAccount)}</span>
              <span className="ml-auto text-[11px] text-[#c3c1cb]"><TimeAgo isoString={tx.createdAt} /></span>
              <span className="text-[11px] bg-[#f6f5f8] text-[#6b6975] px-1.5 py-0.5 rounded">{tx.operationCount} ops</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
