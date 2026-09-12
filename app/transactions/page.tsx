import { Suspense } from "react";
import TransactionExplorer from "@/components/TransactionExplorer";

export const dynamic = 'force-dynamic';

export default function TransactionsPage() {
  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12">
      <h1 className="font-extrabold text-3xl mb-5 text-[#0e0e12]">Transactions</h1>
      {/*
        The explorer reads filters from the URL with `useSearchParams`, which
        Next requires to sit inside a Suspense boundary. Fetching moved to the
        client with it: pagination needs the cursor to live alongside the rows
        it produced, which a server component re-rendering per request cannot
        hold.
      */}
      <Suspense fallback={<div className="p-8 text-center text-[#a6a3b0] text-sm">Loading transactions…</div>}>
        <TransactionExplorer />
      </Suspense>
    </div>
  );
}
