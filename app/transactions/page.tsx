import { Suspense } from "react";
import type { Metadata } from "next";
import { routeMetadata } from "@/lib/metadata";
import { TRANSACTIONS } from "@/lib/routes";
import TransactionExplorer from "@/components/TransactionExplorer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = routeMetadata(TRANSACTIONS);

export default function TransactionsPage() {
  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12">
      <h1 className="font-extrabold text-3xl mb-5 text-[var(--color-text-primary)]">
        Transactions
      </h1>
      {/*
        The explorer reads filters from the URL with `useSearchParams`, which
        Next requires to sit inside a Suspense boundary. Fetching moved to the
        client with it: pagination needs the cursor to live alongside the rows
        it produced, which a server component re-rendering per request cannot
        hold.
      */}
      <Suspense
        fallback={
          <div
            role="status"
            className="p-8 text-center text-[var(--color-text-muted)] text-sm"
          >
            <span className="sr-only">Loading transactions</span>Loading
            transactions…
          </div>
        }
      >
        <TransactionExplorer />
      </Suspense>
    </div>
  );
}
