'use client';

import { useState } from "react";
import type { Transaction } from "@/lib/types";
import TransactionRow from "@/components/TransactionRow";

const th = "text-left text-[11px] tracking-[0.06em] uppercase text-[#a6a3b0] px-3 py-2.5 border-b border-[#e5e3ea] bg-[#fafafa]";

export default function TransactionFilterList({ txs }: { txs: Transaction[] }) {
  const [filter, setFilter] = useState<"all" | "successful" | "failed">("all");
  const filtered = filter === "all" ? txs : txs.filter(t => (filter === "successful") === t.successful);

  return (
    <>
      <div className="inline-flex border border-[#e5e3ea] rounded-[9px] overflow-hidden mb-6">
        {(["all", "successful", "failed"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`border-none px-[18px] py-[9px] text-sm font-semibold capitalize transition-colors ${
              filter === f ? "bg-[#8b5cf6] text-white" : "bg-white text-[#6b6975] hover:bg-[#fafafa]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-[#e5e3ea] overflow-x-auto">
        {txs.length === 0 ? (
          <div className="p-8 text-center text-[#a6a3b0] text-sm">No transactions indexed yet.</div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className={`${th} w-6`} />
                <th className={th}>Hash</th>
                <th className={th}>Ledger</th>
                <th className={th}>Source</th>
                <th className={th}>Ops</th>
                <th className={th}>Fee</th>
                <th className={th}>Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(tx => <TransactionRow key={tx.hash} tx={tx} />)}
            </tbody>
          </table>
        )}
      </div>

      {filtered.length === 0 && txs.length > 0 && (
        <div className="mt-4 p-8 rounded-xl border border-[#e5e3ea] text-center text-[#a6a3b0] text-sm">
          No {filter !== "all" ? filter : ""} transactions found in the current batch.
        </div>
      )}
    </>
  );
}
