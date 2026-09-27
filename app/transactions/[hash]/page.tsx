import type { Metadata } from "next";
import { TransactionDetailDocument as TRANSACTION_QUERY } from "@/lib/generated/graphql";
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
import type { TransactionDetailQuery } from "@/lib/generated/graphql";
import BackendUnavailable from "@/components/BackendUnavailable";
import CopyAddressButton from "@/components/CopyAddressButton";
import TimeAgo from "@/components/TimeAgo";

export const dynamic = "force-dynamic";

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
  transaction: TransactionDetailQuery["transaction"];
  unavailable: boolean;
}> {
  try {
    const data = await gqlFetch(GRAPHQL_URL, TRANSACTION_QUERY, { hash });
    return { transaction: data.transaction, unavailable: false };
  } catch {
    return { transaction: null, unavailable: true };
  }
}

const th =
  "text-left text-[11px] tracking-[0.06em] uppercase text-[#a6a3b0] px-3 py-2.5 border-b border-[#e5e3ea] bg-[#fafafa]";
const stat = "bg-[#fafafa] border border-[#e5e3ea] rounded-xl p-4";
const statLabel = "text-[11px] text-[#a6a3b0] uppercase tracking-[0.05em]";
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
        className="inline-block text-[13px] font-semibold text-[#7c3aed] hover:text-[#6d28d9] mb-[18px]"
      >
        &larr; Back to Transactions
      </Link>
      {unavailable ? (
        <BackendUnavailable />
      ) : !transaction ? (
        <div className="p-8 rounded-xl border border-[#fecaca] text-center">
          <p className="text-[#dc2626] font-semibold mb-2">
            Transaction Not Found
          </p>
          <p className="text-[#a6a3b0] text-sm max-w-md mx-auto">
            The transaction{" "}
            <span className="mono text-[#6b6975] break-all">{hash}</span> is not
            in the index — it may be too new, or it may never have been included
            in a ledger.
          </p>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
            <h1 className="mono font-bold text-[22px] break-all text-[#0e0e12]">
              {transaction.hash}
            </h1>
            <CopyAddressButton address={transaction.hash} />
          </div>
          <p className="text-[#a6a3b0] text-[13px] mb-6">
            Included in ledger {transaction.ledger.toLocaleString()}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className={stat}>
              <div className={statLabel}>Status</div>
              <div
                className={`font-bold text-sm mt-1 ${transaction.successful ? "text-[#16a34a]" : "text-[#dc2626]"}`}
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
              <div className="text-sm mt-1 text-[#0e0e12]">
                <TimeAgo isoString={transaction.createdAt} />
              </div>
            </div>
          </div>

          <h2 className="font-extrabold text-base mb-3 text-[#0e0e12]">
            Details
          </h2>
          <div className="rounded-xl border border-[#e5e3ea] overflow-hidden mb-9">
            <table className="w-full text-sm border-collapse">
              <tbody>
                <tr className="border-b border-[#f0eff3]">
                  <td className="py-2.5 px-3 text-[#a6a3b0] text-xs w-[140px]">
                    Source account
                  </td>
                  <td className="py-2.5 px-3">
                    <Link
                      href={`/accounts/${transaction.sourceAccount}`}
                      className="mono text-xs text-[#7c3aed] hover:text-[#6d28d9] hover:underline transition-colors"
                    >
                      {transaction.sourceAccount}
                    </Link>
                  </td>
                </tr>
                <tr className="border-b border-[#f0eff3]">
                  <td className="py-2.5 px-3 text-[#a6a3b0] text-xs">
                    Memo type
                  </td>
                  <td className="py-2.5 px-3 mono text-xs text-[#0e0e12]">
                    {transaction.memoType ?? "none"}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-[#a6a3b0] text-xs">Memo</td>
                  <td className="py-2.5 px-3 mono text-xs text-[#0e0e12] break-all">
                    {transaction.memo ?? "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="font-extrabold text-base mb-3 text-[#0e0e12]">
            Operations
          </h2>
          <div className="rounded-xl border border-[#e5e3ea] overflow-x-auto">
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
                  {transaction.operations.map((op) => (
                    <tr
                      key={op.id}
                      className="border-b border-[#f0eff3] last:border-0"
                    >
                      <td className="py-2.5 px-3 text-xs font-semibold text-[#0e0e12]">
                        {formatOperationType(op.type.toLowerCase())}
                      </td>
                      <td className="py-2.5 px-3 mono text-xs text-[#6b6975]">
                        {op.from ? (
                          <Link
                            href={`/accounts/${op.from}`}
                            className="hover:text-[#7c3aed] hover:underline transition-colors"
                          >
                            {truncateAddress(op.from, 6)}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-2.5 px-3 mono text-xs text-[#6b6975]">
                        {op.to ? (
                          <Link
                            href={`/accounts/${op.to}`}
                            className="hover:text-[#7c3aed] hover:underline transition-colors"
                          >
                            {truncateAddress(op.to, 6)}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-2.5 px-3 mono text-xs text-[#0e0e12]">
                        {op.amount
                          ? `${formatXLM(op.amount)} ${op.asset ?? ""}`.trim()
                          : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-xs text-[#c3c1cb]">
                        <TimeAgo isoString={op.createdAt} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-[#a6a3b0] text-sm">
                No operations were indexed for this transaction.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
