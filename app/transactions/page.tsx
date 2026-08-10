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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="text-3xl font-bold text-white mb-2">Transactions</h1>
      <p className="text-slate-400 mb-8">Recent transactions on the Stellar network, served from the Lumina index.</p>
      <TransactionFilterList txs={txs} />
    </div>
  );
}
