import { Suspense } from "react";
import type { Metadata } from "next";
import { routeMetadata } from "@/lib/metadata";
import { EXPLORER } from "@/lib/routes";
import SearchBar from "@/components/SearchBar";
import TransactionExplorer from "@/components/TransactionExplorer";
import TransactionExplorerSkeleton from "@/components/TransactionExplorerSkeleton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = routeMetadata(EXPLORER);

export default function ExplorerPage() {
  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12">
      <h1 className="font-extrabold text-3xl mb-2 text-[#0e0e12]">Explorer</h1>
      <p className="text-[#6b6975] mb-8">
        Search any Stellar account or browse recent transactions in real time.
      </p>

      {/* One input for everything: it classifies an account, transaction hash
          or contract id by shape and routes to the right page, and sends
          anything unrecognised to the backend's memo search. */}
      <div className="mb-3">
        <SearchBar placeholder="Search an account, transaction, contract or memo…" />
      </div>

      <h2 className="font-extrabold text-base mt-7 mb-3 text-[#0e0e12]">
        Recent Transactions
      </h2>
      {/* Shares the transactions page's explorer, so filters, presets and the
          shareable URL behave identically in both places. */}
      <Suspense
        fallback={<TransactionExplorerSkeleton />}
      >
        <TransactionExplorer />
      </Suspense>
    </div>
  );
}
