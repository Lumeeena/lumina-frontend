"use client";

import { useCallback, useState } from "react";
import {
  PairTradesDocument as PAIR_TRADES_QUERY,
  type PairTradesQuery,
} from "@/lib/generated/graphql";
import { gqlFetch, PUBLIC_GRAPHQL_URL } from "@/lib/graphql";
import { useAbortScope } from "@/lib/useAbortScope";
import { formatXLM, truncateAddress } from "@/lib/formatters";
import TimeAgo from "./TimeAgo";
import LoadMoreFooter from "./LoadMoreFooter";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Network } from "@/lib/generated/graphql";

type Trade = PairTradesQuery["trades"]["items"][number];

const PAGE_SIZE = 25;

function assetName(type: string, code: string | null): string {
  return type === "native" ? "XLM" : (code ?? type);
}

function tradePrice(trade: Trade): string {
  return trade.price ?? "—";
}

export default function PairTrades({
  baseAsset,
  counterAsset,
  pairLabel,
  initial,
  network,
}: {
  baseAsset: string;
  counterAsset: string;
  pairLabel: string;
  initial: Trade[];
  network?: Network;
}) {
  const [rows, setRows] = useState(initial);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(initial.length >= 10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scope = useAbortScope(`${baseAsset}-${counterAsset}`);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(null);
    const request = scope.next();
    try {
      const data = await gqlFetch(
        PUBLIC_GRAPHQL_URL,
        PAIR_TRADES_QUERY,
        { baseAsset, counterAsset, limit: PAGE_SIZE, cursor, network },
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
  }, [baseAsset, counterAsset, cursor, hasMore, loading, network, scope]);

  if (rows.length === 0) {
    return (
      <EmptyState
        variant="inline"
        title={`No trades for ${pairLabel}`}
        description="Executed trades for this asset pair will appear here."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div
        role="region"
        aria-label={`Trades for ${pairLabel}`}
        aria-busy={loading || undefined}
        tabIndex={0}
        className="rounded-xl border border-[var(--color-border-default)] overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-fill)]"
      >
        <table className="w-full text-sm border-collapse">
          <caption className="sr-only">Executed trades for {pairLabel}</caption>
          <thead>
            <tr className="text-start text-[11px] tracking-[0.06em] uppercase text-[var(--color-text-muted)]">
              <th scope="col" className="px-3 py-2.5">Time</th>
              <th scope="col" className="px-3 py-2.5">Price</th>
              <th scope="col" className="px-3 py-2.5">Amount</th>
              <th scope="col" className="px-3 py-2.5">Buyer</th>
              <th scope="col" className="px-3 py-2.5">Seller</th>
              <th scope="col" className="px-3 py-2.5">Transaction</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((trade) => {
              const baseAssetName = assetName(trade.baseAssetType, trade.baseAssetCode);
              const counterAssetName = assetName(
                trade.counterAssetType,
                trade.counterAssetCode,
              );

              const buyer = trade.baseIsSeller ? trade.counterAccount : trade.baseAccount;
              const seller = trade.baseIsSeller ? trade.baseAccount : trade.counterAccount;

              return (
                <tr
                  key={trade.id}
                  className="border-t border-[var(--color-bg-overlay)]"
                >
                  <td className="px-3 py-2.5 text-xs text-[var(--color-text-faint)]">
                    <TimeAgo isoString={trade.ledgerCloseTime} />
                  </td>
                  <td className="px-3 py-2.5 mono text-xs">
                    {tradePrice(trade)} {counterAssetName}
                  </td>
                  <td className="px-3 py-2.5 mono text-xs">
                    <span>{formatXLM(trade.baseAmount)} {baseAssetName}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    {buyer ? (
                      <a
                        href={`/accounts/${buyer}`}
                        aria-label={`View buyer account ${buyer}`}
                        className="mono text-xs text-[var(--color-accent-text)] hover:underline"
                      >
                        {truncateAddress(buyer, 5)}
                      </a>
                    ) : (
                      <span className="text-xs text-[var(--color-text-muted)]">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {seller ? (
                      <a
                        href={`/accounts/${seller}`}
                        aria-label={`View seller account ${seller}`}
                        className="mono text-xs text-[var(--color-accent-text)] hover:underline"
                      >
                        {truncateAddress(seller, 5)}
                      </a>
                    ) : (
                      <span className="text-xs text-[var(--color-text-muted)]">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {trade.transactionHash ? (
                      <a
                        href={`/transactions/${trade.transactionHash}`}
                        aria-label={`View transaction ${trade.transactionHash}`}
                        className="text-xs text-[var(--color-accent-text)] hover:underline"
                      >
                        {truncateAddress(trade.transactionHash, 6)}
                      </a>
                    ) : (
                      <span className="text-xs text-[var(--color-text-muted)]">—</span>
                    )}
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
    </div>
  );
}
