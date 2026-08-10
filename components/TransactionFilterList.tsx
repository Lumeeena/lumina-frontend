'use client';

import { useState } from "react";
import type { Transaction } from "@/lib/types";
import TransactionRow from "@/components/TransactionRow";

export default function TransactionFilterList({ txs }: { txs: Transaction[] }) {
  const [filter, setFilter] = useState<"all" | "successful" | "failed">("all");
  const filtered = filter === "all" ? txs : txs.filter(t => (filter === "successful") === t.successful);

  return (
    <>
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
        {txs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No transactions indexed yet.</div>
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
              {filtered.map(tx => <TransactionRow key={tx.hash} tx={tx} />)}
            </tbody>
          </table>
        )}
      </div>

      {filtered.length === 0 && txs.length > 0 && (
        <div className="mt-4 p-8 rounded-xl bg-[#0c1222] border border-[#162032] text-center text-slate-500 text-sm">
          No {filter !== "all" ? filter : ""} transactions found in the current batch.
        </div>
      )}
    </>
  );
}
