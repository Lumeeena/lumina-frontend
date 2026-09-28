"use client";

import { LiveFeedTransactionsDocument as RECENT_TRANSACTIONS_QUERY } from "@/lib/generated/graphql";
import { LiveFeedNewTransactionDocument as NEW_TRANSACTION_SUBSCRIPTION } from "@/lib/generated/graphql";

import { useCallback, useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Pause, Play } from "lucide-react";
import { gqlFetch, PUBLIC_GRAPHQL_URL } from "@/lib/graphql";
import { useAbortScope } from "@/lib/useAbortScope";
import { useSubscription } from "@/lib/useSubscription";
import type { Transaction } from "@/lib/types";
import { truncateAddress } from "@/lib/formatters";
import TimeAgo from "./TimeAgo";
import ConnectionIndicator from "./ConnectionIndicator";
import { EmptyState } from "@/components/ui/EmptyState";
import { InlineLoading } from "@/components/ui/InlineLoading";

/**
 * How many transactions the feed keeps.
 *
 * A subscription-backed list grows forever on a tab left open overnight, so it
 * is capped ΓÇö this is a "what's happening now" panel, not a scrollback buffer.
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

  // Seed, reconnect and poll all ask the same question, so they share one
  // scope: whichever asked last is the answer that counts, and a poll that is
  // still in flight when the next one starts is cancelled rather than allowed
  // to arrive afterwards and overwrite the newer one.
  const scope = useAbortScope();

  const fetchRecent = useCallback(async () => {
    const req = scope.next();
    try {
      const data = await gqlFetch(
        PUBLIC_GRAPHQL_URL,
        RECENT_TRANSACTIONS_QUERY,
        { limit: SEED_LIMIT },
        { signal: req.signal },
      );
      if (req.isCurrent() && data.transactions.items.length > 0) {
        setTxs(data.transactions.items.slice(0, MAX_FEED_LENGTH));
        setLastUpdated(new Date());
      }
    } catch {
      // Keep showing the last successful fetch rather than blanking the panel.
    }
    setLoading(false);
  }, [scope]);

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
  // given up ΓÇö a restrictive proxy or a browser without WebSocket should
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
    <div className="rounded-xl border border-[var(--color-border-default)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]">
        <ConnectionIndicator
          state={state}
          failureReason={failureReason}
          onRetry={retry}
        />
        {lastUpdated && (
          <span className="text-[11px] text-[var(--color-text-muted)]">Updated <TimeAgo isoString={lastUpdated.toISOString()} /></span>
        )}
      </div>

      {loading ? (
        <InlineLoading label="Fetching live data" className="p-6 text-center" />
      ) : txs.length === 0 ? (
        <EmptyState
          variant="inline"
          title="No transactions yet"
          description="New transactions will appear here as the network processes them."
          className="p-6 text-center"
        />
      ) : (
        <div>
          {txs.map((tx) => (
            <div
              key={tx.hash}
              className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--color-bg-overlay)] last:border-0"
            >
              <span
                className={`w-[7px] h-[7px] rounded-full shrink-0 ${tx.successful ? "bg-[var(--color-success-text)]" : "bg-[var(--color-error-text)]"}`}
              />
              <a
                href={`https://stellar.expert/explorer/public/tx/${tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mono text-xs text-[var(--color-accent-text)] hover:text-[var(--color-accent-text-hover)] hover:underline transition-colors"
              >
                {truncateAddress(tx.hash, 5)}
              </a>
              <span className="text-xs text-[var(--color-text-muted)] mono">{truncateAddress(tx.sourceAccount)}</span>
              <span className="ml-auto text-[11px] text-[var(--color-text-faint)]"><TimeAgo isoString={tx.createdAt} /></span>
              <span className="text-[11px] bg-[var(--color-bg-raised)] text-[var(--color-text-secondary)] px-1.5 py-0.5 rounded">{tx.operationCount} ops</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}