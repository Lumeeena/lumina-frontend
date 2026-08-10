import { gqlFetch, GRAPHQL_URL } from "@/lib/graphql";
import type { Transaction } from "@/lib/types";
import TransactionFilterList from "@/components/TransactionFilterList";

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

export default async function TransactionsPage() {
  const txs = await getRecentTransactions(50);

  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12">
      <h1 className="font-extrabold text-3xl mb-5 text-[#0e0e12]">Transactions</h1>
      <TransactionFilterList txs={txs} />
    </div>
  );
}
