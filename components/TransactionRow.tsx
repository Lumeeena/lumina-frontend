'use client';

import Link from "next/link";
import type { Transaction } from "@/lib/types";
import { truncateAddress, formatXLM } from "@/lib/formatters";
import { withNetwork } from "@/lib/network";
import { useNetwork } from "@/lib/useNetwork";
import TimeAgo from "./TimeAgo";
import WatchIndicator from "./WatchIndicator";
import { TableCell, TableRow } from "./Table";
import FeeBumpTransactionRow from "./FeeBumpTransactionRow";
import LabeledAddress from "./LabeledAddress";

interface InnerTransaction {
  hash: string;
  sourceAccount: string;
  operationCount: number;
  successful: boolean;
}

interface TransactionRowProps {
  tx: Transaction;
  visibleColumns?: string[];
}

export default function TransactionRow({ tx, visibleColumns }: TransactionRowProps) {
  const { network } = useNetwork();

  // Default to showing all columns if not specified
  const columns = visibleColumns || ["status", "hash", "ledger", "source", "ops", "fee", "time"];

  // Check if this is a fee bump transaction (feePayer field exists and differs from sourceAccount)
  const isFeeBump = (tx as any).feePayer && (tx as any).feePayer !== tx.sourceAccount;

  if (isFeeBump) {
    return (
      <tr className="border-b border-[var(--color-bg-overlay)] last:border-0">
        <td colSpan={Math.max(columns.length, 1)} className="py-2.5 px-3">
          <FeeBumpTransactionRow
            feePayerTransaction={{
              ...tx,
              sourceAccount: (tx as any).feePayer,
            }}
            innerTransaction={(tx as any).innerTransaction ? {
              hash: (tx as any).innerTransaction.hash,
              sourceAccount: (tx as any).innerTransaction.sourceAccount,
              operationCount: (tx as any).innerTransaction.operationCount,
              successful: (tx as any).innerTransaction.successful,
            } : null}
          />
        </td>
      </tr>
    );
  }

  const fee = formatXLM(tx.feeCharged);
  return (
    <tr className="border-b border-[var(--color-bg-overlay)] last:border-0">
      {columns.includes("status") && (
        <td className="py-2.5 px-3">
          <span className={`w-2 h-2 rounded-full inline-block ${tx.successful ? "bg-[var(--color-success-text)]" : "bg-[var(--color-error-text)]"}`} />
        </td>
      )}
      {columns.includes("hash") && (
        <td className="py-2.5 px-3">
          <a
            href={`https://stellar.expert/explorer/public/tx/${tx.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mono text-xs text-[var(--color-accent-text)] hover:text-[var(--color-accent-text-hover)] hover:underline transition-colors"
            title={tx.hash}
          >
            {truncateAddress(tx.hash, 6)}
          </a>
        </td>
      )}
      {columns.includes("ledger") && (
        <td className="py-2.5 px-3 mono text-xs text-[var(--color-text-secondary)]">
          <Link href={withNetwork(`/ledgers/${tx.ledger}`, network)} className="hover:text-[var(--color-accent-text)] hover:underline transition-colors">
            {tx.ledger.toLocaleString()}
          </Link>
        </td>
      )}
      {columns.includes("source") && (
        <td className="py-2.5 px-3 mono text-xs text-[var(--color-text-secondary)]">
          <span className="inline-flex items-center gap-1">
            <LabeledAddress address={tx.sourceAccount} linkTo={withNetwork(`/accounts/${tx.sourceAccount}`, network)} />
            <WatchIndicator address={tx.sourceAccount} />
          </span>
        </td>
      )}
      {columns.includes("ops") && (
        <td className="py-2.5 px-3">
          <span className="text-[11px] bg-[var(--color-bg-raised)] text-[var(--color-text-secondary)] px-1.5 py-0.5 rounded">{tx.operationCount}</span>
        </td>
      )}
      {columns.includes("fee") && (
        <td className="py-2.5 px-3 mono text-xs text-[var(--color-text-muted)]">{fee} XLM</td>
      )}
      {columns.includes("time") && (
        <td className="py-2.5 px-3 text-xs text-[var(--color-text-faint)]"><TimeAgo isoString={tx.createdAt} /></td>
      )}
    </tr>
  );
}
