import type { Metadata } from "next";
import Link from "next/link";
import { LedgerDetailDocument as LEDGER_QUERY } from "@/lib/generated/graphql";
import { gqlFetch, GRAPHQL_URL } from "@/lib/graphql";
import { routeMetadata } from "@/lib/metadata";
import { SITE_NAME } from "@/lib/site";
import { formatXLM } from "@/lib/formatters";
import type { Ledger } from "@/lib/types";
import BackendUnavailable from "@/components/BackendUnavailable";
import TimeAgo from "@/components/TimeAgo";
import TransactionRow from "@/components/TransactionRow";

export const dynamic = "force-dynamic";

export function generateMetadata({
  params,
}: {
  params: Promise<{ sequence: string }>;
}): Promise<Metadata> {
  return params.then(({ sequence }) => {
    return routeMetadata({
      label: `Ledger ${sequence}`,
      description: `Stellar ledger ${sequence}: close time, fees, reserve and transactions, indexed on Lumina.`,
      path: `/ledgers/${sequence}`,
      image: `/ledgers/${sequence}/opengraph-image`,
      imageAlt: `Ledger ${sequence} on ${SITE_NAME}`,
    });
  });
}

async function getLedger(sequence: number): Promise<{
  ledger: Ledger | null;
  transactions: any[];
  unavailable: boolean;
}> {
  try {
    const data = await gqlFetch(GRAPHQL_URL, LEDGER_QUERY, { sequence });
    return {
      ledger: data.ledger,
      transactions: data.transactions?.items ?? [],
      unavailable: false,
    };
  } catch {
    return { ledger: null, transactions: [], unavailable: true };
  }
}

const stat =
  "bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] rounded-xl p-4";
const statLabel =
  "text-[11px] text-[var(--color-text-muted)] uppercase tracking-[0.05em]";
const statValue = "mono text-sm mt-1";

export default async function LedgerPage({
  params,
}: {
  params: Promise<{ sequence: string }>;
}) {
  const { sequence: sequenceStr } = await params;
  const sequence = parseInt(sequenceStr, 10);

  if (isNaN(sequence)) {
    return (
      <div className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12">
        <Link
          href="/transactions"
          className="inline-block text-[13px] font-semibold text-[var(--color-accent-text)] hover:text-[var(--color-accent-text-hover)] mb-[18px]"
        >
          &larr; Back to Transactions
        </Link>
        <div className="p-8 rounded-xl border border-[var(--color-error-outline)] text-center">
          <p className="text-[var(--color-error-text)] font-semibold mb-2">
            Invalid Ledger Sequence
          </p>
          <p className="text-[var(--color-text-muted)] text-sm">
            The ledger sequence must be a number.
          </p>
        </div>
      </div>
    );
  }

  const { ledger, transactions, unavailable } = await getLedger(sequence);

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
      ) : !ledger ? (
        <div className="p-8 rounded-xl border border-[var(--color-error-outline)] text-center">
          <p className="text-[var(--color-error-text)] font-semibold mb-2">
            Ledger Not Found
          </p>
          <p className="text-[var(--color-text-muted)] text-sm max-w-md mx-auto">
            Ledger <span className="mono text-[var(--color-text-secondary)]">{sequence}</span> is not in the index — it may be too new or not yet indexed.
          </p>
        </div>
      ) : (
        <div>
          <div className="mb-6">
            <h1 className="text-[22px] font-bold text-[var(--color-text-primary)] mb-1.5">
              Ledger {ledger.sequence.toLocaleString()}
            </h1>
            <p className="text-[var(--color-text-muted)] text-[13px]">
              Closed at <span className="mono">{new Date(ledger.closedAt).toISOString()}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className={stat}>
              <div className={statLabel}>Transactions</div>
              <div className={statValue}>
                {ledger.transactionCount.toLocaleString()}
              </div>
            </div>
            <div className={stat}>
              <div className={statLabel}>Operations</div>
              <div className={statValue}>
                {ledger.operationCount.toLocaleString()}
              </div>
            </div>
            <div className={stat}>
              <div className={statLabel}>Base Fee</div>
              <div className={statValue}>
                {formatXLM((ledger.baseFee / 1e7).toFixed(7))} XLM
              </div>
            </div>
            <div className={stat}>
              <div className={statLabel}>Base Reserve</div>
              <div className={statValue}>
                {formatXLM((ledger.baseReserve / 1e7).toFixed(7))} XLM
              </div>
            </div>
          </div>

          {transactions.length > 0 && (
            <>
              <h2 className="font-extrabold text-base mb-3 text-[var(--color-text-primary)]">
                Transactions in This Ledger
              </h2>
              <div className="rounded-xl border border-[var(--color-border-default)] overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <caption className="sr-only">Transactions in ledger</caption>
                  <thead>
                    <tr className="text-left text-[11px] tracking-[0.06em] uppercase text-[var(--color-text-muted)] px-3 py-2.5 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]">
                      <th className="px-3 py-2.5 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] font-semibold">Status</th>
                      <th className="px-3 py-2.5 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] font-semibold">Hash</th>
                      <th className="px-3 py-2.5 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] font-semibold">Account</th>
                      <th className="px-3 py-2.5 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] font-semibold">Operations</th>
                      <th className="px-3 py-2.5 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] font-semibold">Fee</th>
                      <th className="px-3 py-2.5 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] font-semibold">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <TransactionRow key={tx.hash} tx={tx} />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
