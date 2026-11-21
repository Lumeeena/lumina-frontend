"use client";

/**
 * One asset's balance over the last 90 days, for the account portfolio.
 *
 * The backend derives the history by replaying the account's indexed
 * payments, path payments, account creations and merges, so fees and DEX
 * trades are not in it, and the line can differ from the live balance in the
 * table above. The caption says so rather than leaving it to look like a bug.
 *
 * The chart's parent keys it on the asset, so switching assets mounts a fresh
 * one: there is no previous asset's answer to discard, and the request for it
 * is aborted on unmount.
 */

import { useCallback, useEffect, useState } from "react";
import {
  AccountBalanceHistoryDocument,
  type AccountBalanceHistoryQuery,
} from "@/lib/generated/graphql";
import { gqlFetch, PUBLIC_GRAPHQL_URL } from "@/lib/graphql";
import { useAbortScope } from "@/lib/useAbortScope";
import {
  isFresh,
  queryGeneration,
  queryKey,
  readQuery,
  writeQuery,
} from "@/lib/queryCache";
import {
  BALANCE_HISTORY_DAYS,
  balanceHistoryRange,
  dailyBalances,
  sampleLabel,
} from "@/lib/balanceHistory";
import { AreaChart, type AreaChartPoint } from "@/components/charts/AreaChart";
import { EmptyState } from "@/components/ui/EmptyState";
import { InlineError } from "@/components/ui/InlineError";

/** Daily points over 90 days, so an answer a minute old is as useful as a fresh one. */
const HISTORY_FRESH_MS = 60_000;

const HEIGHT = 280;

type History = AccountBalanceHistoryQuery["accountBalanceHistory"];

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; data: History };

export interface BalanceHistoryChartProps {
  /** The account whose balance is charted. */
  address: string;
  /** The asset as the API names it: "CODE:ISSUER", or "XLM" for native. */
  asset: string;
  /** What to call the asset on screen, e.g. "USDC". */
  label: string;
}

export default function BalanceHistoryChart({
  address,
  asset,
  label,
}: BalanceHistoryChartProps) {
  // Keyed without the range: it always means "the 90 days ending now", so the
  // last answer is the one to show while a newer one loads.
  const key = queryKey(
    PUBLIC_GRAPHQL_URL,
    AccountBalanceHistoryDocument.toString(),
    { address, asset },
  );

  // A repeat visit paints from the last answer at once. The parent remounts
  // this component per asset, so reading the cache at mount is enough.
  const [state, setState] = useState<FetchState>(() => {
    const cached = readQuery<AccountBalanceHistoryQuery>(key);
    return cached
      ? { status: "done", data: cached.data.accountBalanceHistory }
      : { status: "loading" };
  });
  const scope = useAbortScope(key);

  /**
   * Ask the network. State changes only in the settled-promise handlers, and
   * only while this request is still the current one. `hasFallback` says
   * whether a cached history is on screen, which a failure then leaves alone.
   */
  const request = useCallback(
    (hasFallback: boolean) => {
      const variables = { address, asset, ...balanceHistoryRange(Date.now()) };
      const generation = queryGeneration();
      const req = scope.next();
      gqlFetch(PUBLIC_GRAPHQL_URL, AccountBalanceHistoryDocument, variables, {
        signal: req.signal,
      }).then(
        (data) => {
          writeQuery(key, data, { generation });
          if (!req.isCurrent()) return;
          setState({ status: "done", data: data.accountBalanceHistory });
        },
        (err: unknown) => {
          if (!req.isCurrent() || hasFallback) return;
          setState({
            status: "error",
            message:
              err instanceof Error
                ? err.message
                : "Could not load balance history.",
          });
        },
      );
    },
    [address, asset, key, scope],
  );

  useEffect(() => {
    const cached = readQuery<AccountBalanceHistoryQuery>(key);
    if (cached && isFresh(cached, HISTORY_FRESH_MS)) return;
    request(cached !== undefined);
  }, [key, request]);

  const retry = () => {
    setState({ status: "loading" });
    request(false);
  };

  const period = `the last ${BALANCE_HISTORY_DAYS} days`;

  return (
    <div className="mb-4">
      {/* The skeleton is aria-hidden, so loading is announced here instead. */}
      <p role="status" className="sr-only">
        {state.status === "loading" ? `Loading ${label} balance history` : ""}
      </p>

      {state.status === "loading" ? (
        <div
          className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] animate-pulse motion-reduce:animate-none"
          style={{ height: HEIGHT }}
          aria-hidden="true"
        />
      ) : state.status === "error" ? (
        <InlineError
          message={state.message}
          onRetry={retry}
          minHeight={HEIGHT}
        />
      ) : (
        <BalanceHistoryPanel data={state.data} label={label} period={period} />
      )}
    </div>
  );
}

function BalanceHistoryPanel({
  data,
  label,
  period,
}: {
  data: History;
  label: string;
  period: string;
}) {
  const samples = dailyBalances(data.snapshots, data.from, data.to);

  if (samples.length === 0) {
    return (
      <EmptyState
        title={`No ${label} balance in ${period}`}
        description={`This account held no ${label} and moved none in ${period}, as far as the index knows.`}
        className="min-h-[280px] flex flex-col items-center justify-center"
      />
    );
  }

  const points: AreaChartPoint[] = samples.map((s) => ({
    label: sampleLabel(s.at),
    value: parseFloat(s.balance),
  }));

  return (
    <AreaChart
      title={`${label} balance`}
      description={`This account's ${label} balance once a day over ${period}.`}
      data={points}
      unit={` ${label}`}
      caption={`Daily balance · ${period} · from indexed payments and account operations; fees and trades are not counted`}
      height={HEIGHT}
    />
  );
}
