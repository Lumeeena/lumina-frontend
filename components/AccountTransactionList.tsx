"use client";

import { AccountTransactionsDocument as ACCOUNT_TRANSACTIONS_QUERY } from "@/lib/generated/graphql";

/**
 * An account's transactions, paginated.
 *
 * The account's nested `transactions` field is limit-only — the API has no
 * cursor for account-scoped transactions — so "load more" widens the limit
 * rather than following a cursor: each fetch re-reads the newest N and keeps
 * the tail beyond what is already shown. It reuses the explorer's pagination
 * *approach* — an explicit Load more, an honest truncation label, and an
 * end-of-results state — on the one read shape offered here.
 */
import { useCallback, useState } from 'react';
import { gqlFetch, PUBLIC_GRAPHQL_URL } from '@/lib/graphql';
import type { Transaction } from '@/lib/types';
import { truncateAddress } from '@/lib/formatters';
import TimeAgo from './TimeAgo';
import LoadMoreFooter from './LoadMoreFooter';

const ACCOUNT_TRANSACTIONS_QUERY = `
  query AccountTransactions($address: String!, $limit: Int) {
    account(address: $address) {
      transactions(limit: $limit) {
        hash
        ledger
        createdAt
        sourceAccount
        operationCount
      }
    }
  }
`;

/** The seed the server component renders; the first client fetch widens past it. */
export const SEED_LIMIT = 10;
/** Each load more widens the window: 10 → 25 → 60 → 150 → 375. */
const LIMIT_STEPS = [10, 25, 60, 150, 375];

const th =
  "text-left text-[11px] tracking-[0.06em] uppercase text-[#a6a3b0] px-3 py-2.5 border-b border-[#e5e3ea] bg-[#fafafa]";

export default function AccountTransactionList({
  address,
  initial,
}: {
  address: string;
  initial: Transaction[];
}) {
  const [rows, setRows] = useState(initial);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const limit = LIMIT_STEPS[step];
  // A full page means there may be more behind it; a short page means the
  // account has nothing older — the same `items.length === limit` signal the
  // explorer reads pageInfo for.
  const hasMore = rows.length >= limit && step < LIMIT_STEPS.length - 1;

  const loadMore = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const data = await gqlFetch(
        PUBLIC_GRAPHQL_URL,
        ACCOUNT_TRANSACTIONS_QUERY,
        { address, limit: LIMIT_STEPS[step + 1] },
      );
      const fetched = data.account?.transactions;
      if (!fetched) throw new Error("Account transactions unavailable");
      setRows((prev) => {
        // The re-read overlaps what is shown (and new transactions may have
        // shifted it); a hash already shown is never rendered twice.
        const seen = new Set(prev.map((tx) => tx.hash));
        return [...prev, ...fetched.filter((tx) => !seen.has(tx.hash))];
      });
      setStep((s) => s + 1);
    } catch {
      setError("Could not load more transactions.");
    } finally {
      setLoading(false);
    }
  }, [address, step, loading]);

  if (rows.length === 0) {
    return <p className="text-sm text-[#a6a3b0]">No transactions yet.</p>;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3 text-[13px] text-[#6b6975]">
        <span data-testid="transaction-count">
          {hasMore
            ? `Showing the ${rows.length} most recent transactions`
            : `All ${rows.length} transactions`}
        </span>
      </div>

      <div className="rounded-xl border border-[#e5e3ea] overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className={th}>Hash</th>
              <th className={th}>Ledger</th>
              <th className={th}>Ops</th>
              <th className={th}>Time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((tx) => (
              <tr
                key={tx.hash}
                className="border-b border-[#f0eff3] last:border-0"
              >
                <td className="py-2.5 px-3">
                  <a
                    href={`https://stellar.expert/explorer/public/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mono text-xs text-[#7c3aed] hover:text-[#6d28d9] hover:underline transition-colors"
                  >
                    {truncateAddress(tx.hash, 6)}
                  </a>
                </td>
                <td className="py-2.5 px-3 mono text-xs">
                  {tx.ledger.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-xs">{tx.operationCount}</td>
                <td className="py-2.5 px-3 text-xs text-[#c3c1cb]"><TimeAgo isoString={tx.createdAt} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <LoadMoreFooter
        loading={loading}
        error={error}
        hasMore={hasMore}
        endLabel="End of results"
        onLoadMore={loadMore}
      />
    </>
  );
}
