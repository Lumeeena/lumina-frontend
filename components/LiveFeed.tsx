'use client';

import { useState, useEffect, useCallback } from "react";
import { gqlFetch, PUBLIC_GRAPHQL_URL } from "@/lib/graphql";
import type { Transaction } from "@/lib/types";
import { truncateAddress, timeAgo } from "@/lib/formatters";

const RECENT_TRANSACTIONS_QUERY = `
  query LiveFeedTransactions($limit: Int) {
    transactions(limit: $limit) {
      items {
        hash
        ledger
        createdAt
        sourceAccount
        feeCharged
        operationCount
        successful
      }
    }
  }
`;

export default function LiveFeed() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await gqlFetch<{ transactions: { items: Transaction[] } }>(PUBLIC_GRAPHQL_URL, RECENT_TRANSACTIONS_QUERY, { limit: 10 });
      if (data.transactions.items.length > 0) {
        setTxs(data.transactions.items);
        setLastUpdated(new Date());
      }
    } catch {
      // keep showing the last successful fetch
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <div className="rounded-xl border border-[#e5e3ea] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e3ea] bg-[#fafafa]">
        <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-[#0e0e12]">
          <span className="w-[7px] h-[7px] rounded-full bg-[#16a34a] shadow-[0_0_0_3px_rgba(22,163,74,0.15)]" />
          LIVE
        </div>
        {lastUpdated && (
          <span className="text-[11px] text-[#a6a3b0]">Updated {timeAgo(lastUpdated.toISOString())}</span>
        )}
      </div>

      {loading ? (
        <div className="p-6 text-center text-[#a6a3b0] text-sm animate-pulse">Fetching live data...</div>
      ) : txs.length === 0 ? (
        <div className="p-6 text-center text-[#a6a3b0] text-sm">No transactions found.</div>
      ) : (
        <div>
          {txs.map(tx => (
            <div key={tx.hash} className="flex items-center gap-3 px-4 py-2.5 border-b border-[#f0eff3] last:border-0">
              <span className={`w-[7px] h-[7px] rounded-full shrink-0 ${tx.successful ? "bg-[#16a34a]" : "bg-[#dc2626]"}`} />
              <a
                href={`https://stellar.expert/explorer/public/tx/${tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mono text-xs text-[#7c3aed] hover:text-[#6d28d9] hover:underline transition-colors"
              >
                {truncateAddress(tx.hash, 5)}
              </a>
              <span className="text-xs text-[#a6a3b0] mono">{truncateAddress(tx.sourceAccount)}</span>
              <span className="ml-auto text-[11px] text-[#c3c1cb]">{timeAgo(tx.createdAt)}</span>
              <span className="text-[11px] bg-[#f6f5f8] text-[#6b6975] px-1.5 py-0.5 rounded">{tx.operationCount} ops</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
