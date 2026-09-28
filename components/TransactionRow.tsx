import Link from "next/link";
import type { Transaction } from "@/lib/types";
import { truncateAddress, formatXLM } from "@/lib/formatters";
import TimeAgo from "./TimeAgo";
import WatchIndicator from "./WatchIndicator";
import { TableCell, TableRow } from "./Table";

export default function TransactionRow({ tx }: { tx: Transaction }) {
  const fee = (parseInt(tx.feeCharged) / 1e7).toFixed(7);
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
      <td className="py-2.5 px-3 mono text-xs text-[var(--color-text-secondary)]">{tx.ledger.toLocaleString()}</td>
      <td className="py-2.5 px-3 mono text-xs text-[var(--color-text-secondary)]">
        <span className="inline-flex items-center gap-1">
          <Link href={`/accounts/${tx.sourceAccount}`} className="hover:text-[var(--color-accent-text)] hover:underline transition-colors">
            {truncateAddress(tx.sourceAccount)}
          </Link>
          <WatchIndicator address={tx.sourceAccount} />
        </span>
      </td>
      <td className="py-2.5 px-3">
        <span className="text-[11px] bg-[var(--color-bg-raised)] text-[var(--color-text-secondary)] px-1.5 py-0.5 rounded">{tx.operationCount}</span>
      </td>
      <td className="py-2.5 px-3 mono text-xs text-[var(--color-text-muted)]">{formatXLM(fee)} XLM</td>
      <td className="py-2.5 px-3 text-xs text-[var(--color-text-faint)]"><TimeAgo isoString={tx.createdAt} /></td>
    </tr>
  );
}
