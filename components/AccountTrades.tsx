"use client";

import { useCallback, useState } from "react";
import {
  AccountTradesDocument as ACCOUNT_TRADES_QUERY,
  type AccountTradesQuery,
} from "@/lib/generated/graphql";
import { gqlFetch, PUBLIC_GRAPHQL_URL } from "@/lib/graphql";
import { useAbortScope } from "@/lib/useAbortScope";
import { formatXLM, truncateAddress } from "@/lib/formatters";
import TimeAgo from "./TimeAgo";
import LoadMoreFooter from "./LoadMoreFooter";
import { EmptyState } from "@/components/ui/EmptyState";

type Trade = AccountTradesQuery["trades"]["items"][number];

const PAGE_SIZE = 25;

function assetName(type: string, code: string | null): string {
  return type === "native" ? "XLM" : (code ?? type);
}

function tradePrice(trade: Trade): string {
  return trade.price ?? "—";
}

export default function AccountTrades({
  address,
  initial,
}: {
  address: string;
  initial: Trade[];
}) {
  const [rows, setRows] = useState(initial);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(initial.length >= 10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scope = useAbortScope(address);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(null);
    const request = scope.next();
    try {
      const data = await gqlFetch(
        PUBLIC_GRAPHQL_URL,
        ACCOUNT_TRADES_QUERY,
        { address, limit: PAGE_SIZE, cursor },
        { signal: request.signal },
      );
      if (!request.isCurrent()) return;
      const page = data.trades;
      setRows((current) => {
        const seen = new Set(current.map((trade) => trade.id));
        return [...current, ...page.items.filter((trade) => !seen.has(trade.id))];
      });
      setCursor(page.pageInfo.cursor);
      setHasMore(page.pageInfo.hasNextPage && page.pageInfo.cursor !== null);
    } catch {
      if (!request.isCurrent()) return;
      setError("Could not load more trades.");
    } finally {
      setLoading(false);
    }
  }, [address, cursor, hasMore, loading, scope]);

  if (rows.length === 0) {
    return (
      <EmptyState
        variant="inline"
        title="No trades yet"
        description="Executed trades involving this account will appear here."
      />
    );
  }

  return (
    <>
      <div
        role="region"
        aria-label="Account trades"
        aria-busy={loading || undefined}
        tabIndex={0}
        className="rounded-xl border border-[var(--color-border-default)] overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-fill)]"
      >
        <table className="w-full text-sm border-collapse">
          <caption className="sr-only">Executed trades for this account</caption>
          <thead>
            <tr className="text-start text-[11px] tracking-[0.06em] uppercase text-[var(--color-text-muted)]">
              <th scope="col" className="px-3 py-2.5">Time</th>
              <th scope="col" className="px-3 py-2.5">Pair</th>
              <th scope="col" className="px-3 py-2.5">Amounts</th>
              <th scope="col" className="px-3 py-2.5">Price</th>
              <th scope="col" className="px-3 py-2.5">Counterparty</th>
              <th scope="col" className="px-3 py-2.5">Operation</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((trade) => {
              const counterparty =
                trade.baseAccount === address
                  ? trade.counterAccount
                  : trade.baseAccount;
              const baseAsset = assetName(trade.baseAssetType, trade.baseAssetCode);
              const counterAsset = assetName(
                trade.counterAssetType,
                trade.counterAssetCode,
              );

              return (
                <tr
                  key={trade.id}
                  className="border-t border-[var(--color-bg-overlay)]"
                >
                  <td className="px-3 py-2.5 text-xs text-[var(--color-text-faint)]">
                    <TimeAgo isoString={trade.ledgerCloseTime} />
                  </td>
                  <td className="px-3 py-2.5 mono text-xs">
                    {baseAsset}/{counterAsset}
                  </td>
                  <td className="px-3 py-2.5 mono text-xs">
                    <span>{formatXLM(trade.baseAmount)} {baseAsset}</span>
                    <span aria-hidden="true"> → </span>
                    <span>{formatXLM(trade.counterAmount)} {counterAsset}</span>
                  </td>
                  <td className="px-3 py-2.5 mono text-xs">
                    {tradePrice(trade)}
                  </td>
                  <td className="px-3 py-2.5">
                    {counterparty ? (
                      <a
                        href={`/accounts/${counterparty}`}
                        aria-label={`View counterparty account ${counterparty}`}
                        className="mono text-xs text-[var(--color-accent-text)] hover:underline"
                      >
                        {truncateAddress(counterparty, 5)}
                      </a>
                    ) : (
                      <span className="text-xs text-[var(--color-text-muted)]">
                        Unknown
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <a
                      href={`/accounts/${address}#account-operations`}
                      aria-label={`View account operations for trade ${trade.id}`}
                      className="text-xs text-[var(--color-accent-text)] hover:underline"
                    >
                      View operations
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <LoadMoreFooter
        loading={loading}
        error={error}
        hasMore={hasMore}
        endLabel="End of trades"
        onLoadMore={loadMore}
      />
    </>
  );
}
