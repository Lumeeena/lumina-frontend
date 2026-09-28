"use client";

/**
 * Portfolio section for the account page.
 *
 * Shows a 30-day transfer-volume chart for each asset the account holds.
 * "Transfer volume" is the only time-series data the backend currently
 * exposes per asset — true balance-over-time snapshots are not yet in the
 * schema. Each chart bucket is one calendar day (86 400 s).
 *
 * Many-asset handling
 * -------------------
 * Up to MAX_VISIBLE asset tabs are shown in the pill row. If the account
 * holds more, an overflow toggle reveals the rest so the page does not
 * render dozens of selector buttons above a single chart.
 *
 * Empty state
 * -----------
 * - Account has no balances  → section is hidden entirely (caller's
 *   responsibility; this component does not render when balances is empty).
 * - All buckets for the selected asset are zero → "No activity" message.
 * - Fetch failed → inline error with a retry button.
 */

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  AssetVolumeDocument,
  type AssetVolumeQuery,
} from "@/lib/generated/graphql";
import { gqlFetch, PUBLIC_GRAPHQL_URL } from "@/lib/graphql";
import { useAbortScope } from "@/lib/useAbortScope";
import type { Balance } from "@/lib/types";
import { AreaChart } from "@/components/charts/AreaChart";
import type { AreaChartPoint } from "@/components/charts/AreaChart";
import { Button } from "@/components/ui/Button";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Max pill tabs shown before the overflow toggle appears. */
const MAX_VISIBLE = 8;

/** Daily buckets, 30 days back. The `from` param is omitted so the server
 *  defaults to "30 days before now", keeping the query stateless. */
const BUCKET_SECONDS = 86_400;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Canonical asset key used by the `asset(...)` query: "CODE:ISSUER" or "XLM". */
function assetKey(b: Balance): string {
  return b.assetType === "native"
    ? "XLM"
    : `${b.assetCode ?? ""}:${b.assetIssuer ?? ""}`;
}

/** Human-readable label for a balance entry. */
function assetLabel(b: Balance): string {
  return b.assetType === "native" ? "XLM" : (b.assetCode ?? assetKey(b));
}

/**
 * Format an ISO-8601 bucket start as a short date label.
 * Produces e.g. "Jan 15" without a locale dependency on Intl.DateTimeFormat
 * being present — it always is in the browser, but this keeps the label
 * consistent regardless of the user's locale settings.
 */
function bucketLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** True when every bucket in the series reports zero volume. */
function isAllZero(series: AssetVolumeQuery["asset"]["series"]): boolean {
  return series.every((b) => parseFloat(b.volume) === 0);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div
      className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] animate-pulse"
      style={{ height }}
      aria-hidden="true"
    />
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export interface AccountPortfolioProps {
  /** The account's current balances, passed down from the server component. */
  balances: Balance[];
}

type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; data: AssetVolumeQuery["asset"] };

export default function AccountPortfolio({ balances }: AccountPortfolioProps) {
  // Sort: native XLM first, then descending by current balance value —
  // mirrors the order of the balance table directly above.
  const sorted = [...balances].sort((a, b) => {
    if (a.assetType === "native") return -1;
    if (b.assetType === "native") return 1;
    return (parseFloat(b.balance) || 0) - (parseFloat(a.balance) || 0);
  });

  const [selected, setSelected] = useState<Balance>(sorted[0]);
  const [showAll, setShowAll] = useState(false);
  const [fetchState, setFetchState] = useState<FetchState>({ status: "idle" });

  // Keyed on the selected asset so a stale response from asset A is never
  // applied when the user has already switched to asset B.
  const scope = useAbortScope(assetKey(selected));

  const fetchVolume = useCallback(
    async (balance: Balance) => {
      setFetchState({ status: "loading" });
      const req = scope.next();
      try {
        const data = await gqlFetch(
          PUBLIC_GRAPHQL_URL,
          AssetVolumeDocument,
          { asset: assetKey(balance), bucketSeconds: BUCKET_SECONDS },
          { signal: req.signal },
        );
        if (!req.isCurrent()) return;
        setFetchState({ status: "done", data: data.asset });
      } catch (err) {
        if (!req.isCurrent()) return;
        const message =
          err instanceof Error ? err.message : "Could not load activity data.";
        setFetchState({ status: "error", message });
      }
    },
    [scope],
  );

  // Fetch whenever the selected asset changes (and on mount).
  useEffect(() => {
    void fetchVolume(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  // ── Pill tab list ────────────────────────────────────────────────────────

  const visible = showAll ? sorted : sorted.slice(0, MAX_VISIBLE);
  const overflowCount = sorted.length - MAX_VISIBLE;
  const hasOverflow = sorted.length > MAX_VISIBLE;

  // ── Chart data ───────────────────────────────────────────────────────────

  let chartContent: ReactNode;

  if (fetchState.status === "loading" || fetchState.status === "idle") {
    chartContent = <ChartSkeleton />;
  } else if (fetchState.status === "error") {
    chartContent = (
      <div className="rounded-xl border border-[var(--color-error-outline)] bg-[var(--color-bg-subtle)] flex flex-col items-center justify-center gap-3 p-8 text-center" style={{ minHeight: 280 }}>
        <p className="text-[var(--color-error-text)] text-sm font-semibold">
          Could not load activity data
        </p>
        <p className="text-[var(--color-text-muted)] text-xs max-w-xs">
          {fetchState.message}
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void fetchVolume(selected)}
        >
          Retry
        </Button>
      </div>
    );
  } else {
    // status === "done"
    const series = fetchState.data.series;
    const allZero = isAllZero(series);

    if (allZero) {
      chartContent = (
        <div
          className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] flex flex-col items-center justify-center gap-2 p-8 text-center"
          style={{ minHeight: 280 }}
        >
          <p className="text-[var(--color-text-secondary)] text-sm font-semibold">
            No activity in the last 30 days
          </p>
          <p className="text-[var(--color-text-muted)] text-xs max-w-xs">
            Transfer volume for{" "}
            <span className="font-semibold">{assetLabel(selected)}</span> will
            appear here once this account sends or receives a payment.
          </p>
        </div>
      );
    } else {
      const points: AreaChartPoint[] = series.map((b) => ({
        label: bucketLabel(b.bucketStart),
        value: parseFloat(b.volume),
      }));

      const label = assetLabel(selected);
      const isNative = selected.assetType === "native";
      // Non-native tokens can be any denomination; we label the unit by code.
      const unit = isNative ? " XLM" : ` ${label}`;

      chartContent = (
        <AreaChart
          title={`${label} transfer volume`}
          description={`Daily transfer volume for ${label} over the last 30 days, measured in ${label}.`}
          data={points}
          unit={unit}
          caption="Transfer volume (sent + received) per day · last 30 days · daily buckets"
          height={280}
        />
      );
    }
  }

  return (
    <section aria-labelledby="portfolio-heading" className="mb-9">
      <h2
        id="portfolio-heading"
        className="font-extrabold text-base mb-3 text-[var(--color-text-primary)]"
      >
        Portfolio Activity
      </h2>

      {/* Asset selector pill row */}
      <div className="flex flex-wrap items-center gap-2 mb-4" role="tablist" aria-label="Select asset to view">
        {visible.map((b) => {
          const key = assetKey(b);
          const isActive = assetKey(selected) === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                setSelected(b);
                setFetchState({ status: "idle" });
              }}
              className={[
                "text-[12px] font-semibold rounded-full px-3 py-1 border transition-colors",
                isActive
                  ? "bg-[var(--color-accent-surface)] text-[var(--color-accent-text)] border-[var(--color-accent-9)]"
                  : "bg-transparent text-[var(--color-text-secondary)] border-[var(--color-border-default)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]",
              ].join(" ")}
            >
              {assetLabel(b)}
            </button>
          );
        })}

        {hasOverflow && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="text-[12px] font-semibold rounded-full px-3 py-1 border border-[var(--color-border-default)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] transition-colors"
          >
            {showAll ? "Show less" : `+${overflowCount} more`}
          </button>
        )}
      </div>

      {/* Chart panel */}
      {chartContent}
    </section>
  );
}
