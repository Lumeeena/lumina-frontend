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
import { t } from "@/lib/i18n";
import { EmptyState } from "@/components/ui/EmptyState";
import { InlineLoading } from "@/components/ui/InlineLoading";

/**
 * How many transactions the feed keeps.
 *
 * A subscription-backed list grows forever on a tab left open overnight, so it
 * is capped — this is a "what's happening now" panel, not a scrollback buffer.
 */
export const MAX_FEED_LENGTH = 25;

/** Interval used only when the live connection is unavailable. */
export const FALLBACK_POLL_MS = 30_000;

/** Minimum interval between live-region announcements (ms). */
const ANNOUNCE_THROTTLE_MS = 5_000;

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
  const [announcement, setAnnouncement] = useState("");
  const pausedRef = useRef(false);
  const txsRef = useRef<Transaction[]>([]);
  const queuedRef = useRef<Transaction[]>([]);
  const seenWhilePausedRef = useRef(new Set<string>());
  const lastAnnounceRef = useRef(0);
  const pendingAnnounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    txsRef.current = txs;
  }, [txs]);

  // Throttled announcement helper
  const announce = useCallback((message: string) => {
    const now = Date.now();
    const elapsed = now - lastAnnounceRef.current;

    if (pendingAnnounceRef.current !== null) {
      clearTimeout(pendingAnnounceRef.current);
      pendingAnnounceRef.current = null;
    }

    if (elapsed >= ANNOUNCE_THROTTLE_MS) {
      lastAnnounceRef.current = now;
      setAnnouncement(message);
    } else {
      pendingAnnounceRef.current = setTimeout(() => {
        lastAnnounceRef.current = Date.now();
        pendingAnnounceRef.current = null;
        setAnnouncement(message);
      }, ANNOUNCE_THROTTLE_MS - elapsed);
    }
  }, []);

  useEffect(
    () => () => {
      if (pendingAnnounceRef.current !== null)
        clearTimeout(pendingAnnounceRef.current);
    },
    [],
  );

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

    // The visible banner announces this to sighted users; the live region
    // on the banner (role="status") handles screen readers, so we don't
    // duplicate the text in the sr-only live region.

    if (queued.length === 0) return;
    setTxs((current) => {
      const seen = new Set<string>();
      const merged = [...queued, ...current].filter((tx) => {
        if (seen.has(tx.hash)) return false;
        seen.add(tx.hash);
        return true;
      });
      return merged.slice(0, MAX_FEED_LENGTH);
    });
    setLastUpdated(new Date());
  }, [pendingCount]);

  const prependTransaction = useCallback(
    (tx: Transaction) => {
      if (pausedRef.current) {
        if (seenWhilePausedRef.current.has(tx.hash)) return;
        seenWhilePausedRef.current.add(tx.hash);
        queuedRef.current = [tx, ...queuedRef.current].slice(
          0,
          MAX_FEED_LENGTH,
        );
        setPendingCount((count) => count + 1);
        return;
      }

      setTxs((current) => {
        if (current.some((existing) => existing.hash === tx.hash))
          return current;
        return [tx, ...current].slice(0, MAX_FEED_LENGTH);
      });
      setLastUpdated(new Date());
      announce(t("liveFeed.newTransactions", { count: 1 }));
    },
    [announce],
  );

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

  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    void fetchRecent();
  }, [fetchRecent]);

  useEffect(() => {
    const reconnect = () => {
      void fetchRecent();
      retry();
    };
    window.addEventListener("lumina:online", reconnect);
    return () => window.removeEventListener("lumina:online", reconnect);
  }, [fetchRecent, retry]);

  useEffect(() => {
    if (live) return;
    const interval = setInterval(() => void fetchRecent(), FALLBACK_POLL_MS);
    return () => clearInterval(interval);
  }, [live, fetchRecent]);

  // Auto-pause when a row inside the feed receives focus, so the list doesn't
  // shift under a keyboard or screen-reader user.
  const feedRef = useRef<HTMLDivElement | null>(null);
  const handleFocusIn = useCallback(() => {
    if (!pausedRef.current) pauseFeed();
  }, [pauseFeed]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line react-hooks/incompatible-library -- mutable API is confined to this component
  const virtualizer = useVirtualizer({
    count: txs.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });
  const virtualRows = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - virtualRows[virtualRows.length - 1].end
      : 0;

  const pauseLabel = paused
    ? pendingCount > 0
      ? t("liveFeed.resumeFeedCount", { count: pendingCount })
      : t("liveFeed.resumeFeed")
    : t("liveFeed.pauseFeed");

  return (
    <div className="rounded-xl border border-[var(--color-border-default)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]">
        <ConnectionIndicator
          state={state}
          failureReason={failureReason}
          onRetry={retry}
        />
        <div className="flex items-center gap-2">
          {!loading && txs.length > 0 && (
            <button
              type="button"
              onClick={paused ? resumeFeed : pauseFeed}
              aria-label={pauseLabel}
              aria-pressed={paused || undefined}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors px-1.5 py-1 rounded"
            >
              {paused ? <Play size={12} /> : <Pause size={12} />}
            </button>
          )}
          {lastUpdated && (
            <span className="text-[11px] text-[var(--color-text-muted)]">
              Updated <TimeAgo isoString={lastUpdated.toISOString()} />
            </span>
          )}
        </div>
      </div>

      {paused && pendingCount > 0 && (
        <div
          role="status"
          className="px-4 py-2 text-[11px] font-semibold text-[var(--color-accent-text)] bg-[var(--color-accent-surface)] border-b border-[var(--color-border-default)]"
        >
          {t("liveFeed.updatesWaiting", { count: pendingCount })}
        </div>
      )}

      {resumedCount > 0 && !paused && (
        <div
          role="status"
          className="px-4 py-2 text-[11px] font-semibold text-[var(--color-accent-text)] bg-[var(--color-accent-surface)] border-b border-[var(--color-border-default)]"
        >
          {t("liveFeed.updatesArrived", { count: resumedCount })}
        </div>
      )}

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
        <div
          ref={scrollRef}
          data-testid="live-feed-scroll"
          data-retained-count={txs.length}
          className="overflow-auto"
          style={{ maxHeight: ROW_HEIGHT * 8 }}
        >
          <div
            ref={feedRef}
            role="list"
            aria-label="Live transaction feed"
            onFocusCapture={handleFocusIn}
            style={{ height: totalSize, position: "relative" }}
          >
            {paddingTop > 0 && (
              <div aria-hidden="true" style={{ height: paddingTop }} />
            )}
            {virtualRows.map((virtualRow) => {
              const tx = txs[virtualRow.index];
              return (
                <div
                  key={tx.hash}
                  role="listitem"
                  className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--color-bg-overlay)] last:border-0"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <span
                    aria-hidden="true"
                    className={`w-[7px] h-[7px] rounded-full shrink-0 ${tx.successful ? "bg-[var(--color-success-text)]" : "bg-[var(--color-error-text)]"}`}
                  />
                  <a
                    href={`https://stellar.expert/explorer/public/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Transaction ${truncateAddress(tx.hash, 5)}, ${tx.successful ? "successful" : "failed"}`}
                    className="mono text-xs text-[var(--color-accent-text)] hover:text-[var(--color-accent-text-hover)] hover:underline transition-colors"
                  >
                    {truncateAddress(tx.hash, 5)}
                  </a>
                  <span className="text-xs text-[var(--color-text-muted)] mono">
                    {truncateAddress(tx.sourceAccount)}
                  </span>
                  <span className="ml-auto text-[11px] text-[var(--color-text-faint)]">
                    <TimeAgo isoString={tx.createdAt} />
                  </span>
                  <span className="text-[11px] bg-[var(--color-bg-raised)] text-[var(--color-text-secondary)] px-1.5 py-0.5 rounded">
                    {tx.operationCount} ops
                  </span>
                </div>
              );
            })}
            {paddingBottom > 0 && (
              <div aria-hidden="true" style={{ height: paddingBottom }} />
            )}
          </div>
        </div>
      )}

      {/* Polite live region — announced content is throttled so it does not flood */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
