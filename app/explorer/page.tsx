import { gqlFetch, GRAPHQL_URL } from "@/lib/graphql";
import type { Transaction } from "@/lib/types";
import TransactionRow from "@/components/TransactionRow";

export const dynamic = 'force-dynamic';

const RECENT_TRANSACTIONS_QUERY = `
  query RecentTransactions($limit: Int) {
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

async function getRecentTransactions(limit: number): Promise<Transaction[]> {
  try {
    const data = await gqlFetch<{ transactions: { items: Transaction[] } }>(GRAPHQL_URL, RECENT_TRANSACTIONS_QUERY, { limit });
    return data.transactions.items;
  } catch {
    return [];
  }
}

const th = "text-left text-[11px] tracking-[0.06em] uppercase text-[#a6a3b0] px-3 py-2.5 border-b border-[#e5e3ea] bg-[#fafafa]";

export default async function ExplorerPage() {
  const txs = await getRecentTransactions(20);

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
              {txs.map(tx => <TransactionRow key={tx.hash} tx={tx} />)}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
