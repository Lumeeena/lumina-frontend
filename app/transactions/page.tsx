'use client';

import { useState, useEffect } from "react";
import { getRecentTransactions, HorizonTransaction } from "@/lib/horizon";
import TransactionRow from "@/components/TransactionRow";

export default function TransactionsPage() {
  const [txs, setTxs] = useState<HorizonTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "successful" | "failed">("all");

  useEffect(() => {
    getRecentTransactions(50).then(data => { setTxs(data); setLoading(false); });
  }, []);

  const filtered = filter === "all" ? txs : txs.filter(t => (filter === "successful") === t.successful);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="text-3xl font-bold text-white mb-2">Transactions</h1>
      <p className="text-slate-400 mb-8">Recent transactions on the Stellar network, sourced live from Horizon.</p>

      <div className="flex gap-2 mb-6">
        {(["all", "successful", "failed"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
              filter === f ? "bg-cyan-600 text-white" : "bg-[#0c1222] border border-[#162032] text-slate-400 hover:border-cyan-800"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="rounded-xl bg-[#0c1222] border border-[#162032] overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading from Stellar Horizon...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-[#162032] uppercase tracking-wider">
                <th className="px-4 py-3 w-6" />
                <th className="px-4 py-3">Hash</th>
                <th className="px-4 py-3">Ledger</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Ops</th>
                <th className="px-4 py-3">Fee</th>
                <th className="px-4 py-3">Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(tx => <TransactionRow key={tx.id} tx={tx} />)}
            </tbody>
          </table>
        )}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="mt-4 p-8 rounded-xl bg-[#0c1222] border border-[#162032] text-center text-slate-500 text-sm">
          No {filter !== "all" ? filter : ""} transactions found in the current batch.
        </div>
      )}
    </div>
  );
}
