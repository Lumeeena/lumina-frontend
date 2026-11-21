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

interface InnerTransaction {
  hash: string;
  sourceAccount: string;
  operationCount: number;
  successful: boolean;
}

export default function TransactionRow({ tx }: { tx: Transaction }) {
  const { network } = useNetwork();

  // Check if this is a fee bump transaction (feePayer field exists and differs from sourceAccount)
  const isFeeBump = (tx as any).feePayer && (tx as any).feePayer !== tx.sourceAccount;

  if (isFeeBump) {
    return (
      <tr className="border-b border-[var(--color-bg-overlay)] last:border-0">
        <td colSpan={7} className="py-2.5 px-3">
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
      <td className="py-2.5 px-3">
        <span className={`w-2 h-2 rounded-full inline-block ${tx.successful ? "bg-[var(--color-success-text)]" : "bg-[var(--color-error-text)]"}`} />
      </td>
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
      <td className="py-2.5 px-3 mono text-xs text-[var(--color-text-secondary)]">
        <Link href={withNetwork(`/ledgers/${tx.ledger}`, network)} className="hover:text-[var(--color-accent-text)] hover:underline transition-colors">
          {tx.ledger.toLocaleString()}
        </Link>
      </td>
      <td className="py-2.5 px-3 mono text-xs text-[var(--color-text-secondary)]">
        <span className="inline-flex items-center gap-1">
          <Link href={withNetwork(`/accounts/${tx.sourceAccount}`, network)} className="hover:text-[var(--color-accent-text)] hover:underline transition-colors">
            {truncateAddress(tx.sourceAccount)}
          </Link>
          <WatchIndicator address={tx.sourceAccount} />
        </span>
      </td>
      <td className="py-2.5 px-3">
        <span className="text-[11px] bg-[var(--color-bg-raised)] text-[var(--color-text-secondary)] px-1.5 py-0.5 rounded">{tx.operationCount}</span>
      </td>
      <td className="py-2.5 px-3 mono text-xs text-[var(--color-text-muted)]">{fee} XLM</td>
      <td className="py-2.5 px-3 text-xs text-[var(--color-text-faint)]"><TimeAgo isoString={tx.createdAt} /></td>
    </tr>
  );
}
