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
    <div className="rounded-xl bg-[#0c1222] border border-[#162032] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#162032]">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          LIVE
        </div>
        {lastUpdated && (
          <span className="text-xs text-slate-600">Updated {timeAgo(lastUpdated.toISOString())}</span>
        )}
      </div>

      {loading ? (
        <div className="p-6 text-center text-slate-600 text-sm animate-pulse">Fetching live data...</div>
      ) : txs.length === 0 ? (
        <div className="p-6 text-center text-slate-600 text-sm">No transactions found.</div>
      ) : (
        <div className="divide-y divide-[#0f1a28]">
          {txs.map(tx => (
            <div key={tx.hash} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#0f1a28] transition-colors">
              <span className={`w-2 h-2 rounded-full shrink-0 ${tx.successful ? "bg-green-500" : "bg-red-500"}`} />
              <a
                href={`https://stellar.expert/explorer/public/tx/${tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mono text-xs text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
              >
                {truncateAddress(tx.hash, 5)}
              </a>
              <span className="text-xs text-slate-500 mono">{truncateAddress(tx.sourceAccount)}</span>
              <span className="ml-auto text-xs text-slate-600">{timeAgo(tx.createdAt)}</span>
              <span className="text-xs bg-[#162032] text-slate-400 px-1.5 py-0.5 rounded">{tx.operationCount} ops</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
