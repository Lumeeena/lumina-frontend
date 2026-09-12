import { Suspense } from "react";
import TransactionExplorer from "@/components/TransactionExplorer";

export const dynamic = 'force-dynamic';

export default function ExplorerPage() {
  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12">
      <h1 className="font-extrabold text-3xl mb-2 text-[#0e0e12]">Explorer</h1>
      <p className="text-[#6b6975] mb-8">Search any Stellar account or browse recent transactions in real time.</p>

      <form action="/accounts" method="get" className="flex gap-2.5 mb-3">
        <input
          name="address"
          placeholder="Enter a Stellar account address (G...)"
          className="flex-1 min-h-[46px] px-3.5 py-2.5 text-[13px] mono bg-[#fafafa] border border-[#e5e3ea] rounded-[9px]"
        />
        <button type="submit" className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-bold text-sm px-6 rounded-[9px] transition-colors">
          Search
        </button>
      </form>

      <h2 className="font-extrabold text-base mt-7 mb-3 text-[#0e0e12]">Recent Transactions</h2>
      {/* Shares the transactions page's explorer, so filters, presets and the
          shareable URL behave identically in both places. */}
      <Suspense fallback={<div className="p-8 text-center text-[#a6a3b0] text-sm">Loading transactions…</div>}>
        <TransactionExplorer />
      </Suspense>
    </div>
  );
}
