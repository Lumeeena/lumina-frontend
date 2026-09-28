import type { Metadata } from "next";
import Link from "next/link";
import { gqlFetch, GRAPHQL_URL } from "@/lib/graphql";
import { routeMetadata } from "@/lib/metadata";
import {
  formatOperationType,
  formatXLM,
  truncateAddress,
} from "@/lib/formatters";
// The schema-level types rather than the list-page aliases in `lib/types`:
// this selection set includes the transaction's operations, which the
// transactions table does not select.
import type { Operation, Transaction } from "@/lib/generated/graphql";
import BackendUnavailable from "@/components/BackendUnavailable";
import CopyAddressButton from "@/components/CopyAddressButton";
import TimeAgo from "@/components/TimeAgo";

export const dynamic = "force-dynamic";

const TRANSACTION_QUERY = `
  query TransactionDetail($hash: String!) {
    transaction(hash: $hash) {
      hash
      ledger
      createdAt
      sourceAccount
      feeCharged
      operationCount
      successful
      memoType
      memo
      operations {
        id
        type
        createdAt
        sourceAccount
        from
        to
        amount
        asset
      }
    }
  }
`;

/**
 * Metadata from the hash alone, for the same reason the account page's is:
 * a share card is fetched by bots that do not wait for GraphQL, and a title
 * built from the URL is instant and always correct.
 */
export function generateMetadata({
  params,
}: {
  params: Promise<{ hash: string }>;
}): Promise<Metadata> {
  return params.then(({ hash }) => {
    const short = truncateAddress(hash, 6);
    return routeMetadata({
      label: `Transaction ${short}`,
      description: `Stellar transaction ${hash}: status, fee, memo and operations, indexed on Lumina.`,
      path: `/transactions/${hash}`,
    });
  });
}

async function getTransaction(hash: string): Promise<{
  transaction: Transaction | null;
  unavailable: boolean;
}> {
  try {
    const data = await gqlFetch<{ transaction: Transaction | null }>(
      GRAPHQL_URL,
      TRANSACTION_QUERY,
      { hash },
    );
    return { transaction: data.transaction, unavailable: false };
  } catch {
    return { transaction: null, unavailable: true };
  }
}

const th =
  "text-left text-[11px] tracking-[0.06em] uppercase text-[var(--color-text-muted)] px-3 py-2.5 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]";
const stat = "bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] rounded-xl p-4";
const statLabel = "text-[11px] text-[var(--color-text-muted)] uppercase tracking-[0.05em]";
const statValue = "mono text-sm mt-1";

export default async function TransactionPage({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  const { hash } = await params;
  const { transaction, unavailable } = await getTransaction(hash);

  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12">
      <Link
        href="/transactions"
        className="inline-block text-[13px] font-semibold text-[var(--color-accent-text)] hover:text-[var(--color-accent-text-hover)] mb-[18px]"
      >
        &larr; Back to Transactions
      </Link>
      {unavailable ? (
        <BackendUnavailable />
      ) : !transaction ? (
        <div className="p-8 rounded-xl border border-[var(--color-error-outline)] text-center">
          <p className="text-[var(--color-error-text)] font-semibold mb-2">
            Transaction Not Found
          </p>
          <p className="text-[var(--color-text-muted)] text-sm max-w-md mx-auto">
            The transaction{" "}
            <span className="mono text-[var(--color-text-secondary)] break-all">{hash}</span> is not
            in the index — it may be too new, or it may never have been included
            in a ledger.
          </p>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
            <h1 className="mono font-bold text-[22px] break-all text-[var(--color-text-primary)]">
              {transaction.hash}
            </h1>
            <CopyAddressButton address={transaction.hash} />
          </div>
          <p className="text-[var(--color-text-muted)] text-[13px] mb-6">
            Included in ledger {transaction.ledger.toLocaleString()}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className={stat}>
              <div className={statLabel}>Status</div>
              <div
                className={`font-bold text-sm mt-1 ${transaction.successful ? "text-[var(--color-success-text)]" : "text-[var(--color-error-text)]"}`}
              >
                {transaction.successful ? "Successful" : "Failed"}
              </div>
            </div>
            <div className={stat}>
              <div className={statLabel}>Fee</div>
              <div className={statValue}>
                {formatXLM((parseInt(transaction.feeCharged) / 1e7).toFixed(7))}{" "}
                XLM
              </div>
            </div>
            <div className={stat}>
              <div className={statLabel}>Operations</div>
              <div className={statValue}>{transaction.operationCount}</div>
            </div>
            <div className={stat}>
              <div className={statLabel}>Time</div>
              <div className="text-sm mt-1 text-[var(--color-text-primary)]">
                <TimeAgo isoString={transaction.createdAt} />
              </div>
            </div>
          </div>

          <h2 className="font-extrabold text-base mb-3 text-[var(--color-text-primary)]">
            Details
          </h2>
          <div className="rounded-xl border border-[var(--color-border-default)] overflow-hidden mb-9">
            <table className="w-full text-sm border-collapse">
              <tbody>
                <tr className="border-b border-[var(--color-bg-overlay)]">
                  <td className="py-2.5 px-3 text-[var(--color-text-muted)] text-xs w-[140px]">
                    Source account
                  </td>
                  <td className="py-2.5 px-3">
                    <Link
                      href={`/accounts/${transaction.sourceAccount}`}
                      className="mono text-xs text-[var(--color-accent-text)] hover:text-[var(--color-accent-text-hover)] hover:underline transition-colors"
                    >
                      {transaction.sourceAccount}
                    </Link>
                  </td>
                </tr>
                <tr className="border-b border-[var(--color-bg-overlay)]">
                  <td className="py-2.5 px-3 text-[var(--color-text-muted)] text-xs">
                    Memo type
                  </td>
                  <td className="py-2.5 px-3 mono text-xs text-[var(--color-text-primary)]">
                    {transaction.memoType ?? "none"}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-[var(--color-text-muted)] text-xs">Memo</td>
                  <td className="py-2.5 px-3 mono text-xs text-[var(--color-text-primary)] break-all">
                    {transaction.memo ?? "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="font-extrabold text-base mb-3 text-[var(--color-text-primary)]">
            Operations
          </h2>
          <div className="rounded-xl border border-[var(--color-border-default)] overflow-x-auto">
            {transaction.operations && transaction.operations.length > 0 ? (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className={th}>Type</th>
                    <th className={th}>From</th>
                    <th className={th}>To</th>
                    <th className={th}>Amount</th>
                    <th className={th}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {transaction.operations.map((op: Operation) => (
                    <tr
                      key={op.id}
                      className="border-b border-[var(--color-bg-overlay)] last:border-0"
                    >
                      <td className="py-2.5 px-3 text-xs font-semibold text-[var(--color-text-primary)]">
                        {formatOperationType(op.type.toLowerCase())}
                      </td>
                      <td className="py-2.5 px-3 mono text-xs text-[var(--color-text-secondary)]">
                        {op.from ? (
                          <Link
                            href={`/accounts/${op.from}`}
                            className="hover:text-[var(--color-accent-text)] hover:underline transition-colors"
                          >
                            {truncateAddress(op.from, 6)}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-2.5 px-3 mono text-xs text-[var(--color-text-secondary)]">
                        {op.to ? (
                          <Link
                            href={`/accounts/${op.to}`}
                            className="hover:text-[var(--color-accent-text)] hover:underline transition-colors"
                          >
                            {truncateAddress(op.to, 6)}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-2.5 px-3 mono text-xs text-[var(--color-text-primary)]">
                        {op.amount
                          ? `${formatXLM(op.amount)} ${op.asset ?? ""}`.trim()
                          : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-xs text-[var(--color-text-faint)]">
                        <TimeAgo isoString={op.createdAt} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-[var(--color-text-muted)] text-sm">
                No operations were indexed for this transaction.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
