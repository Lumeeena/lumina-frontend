import Link from "next/link";
import type { Transaction } from "@/lib/types";
import { truncateAddress, timeAgo, formatXLM } from "@/lib/formatters";

export default function TransactionRow({ tx }: { tx: Transaction }) {
  const fee = (parseInt(tx.feeCharged) / 1e7).toFixed(7);
  return (
    <tr className="border-b border-[#f0eff3] last:border-0">
      <td className="py-2.5 px-3">
        <span className={`w-2 h-2 rounded-full inline-block ${tx.successful ? "bg-[#16a34a]" : "bg-[#dc2626]"}`} />
      </td>
      <td className="py-2.5 px-3">
        <a
          href={`https://stellar.expert/explorer/public/tx/${tx.hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mono text-xs text-[#7c3aed] hover:text-[#6d28d9] hover:underline transition-colors"
          title={tx.hash}
        >
          {truncateAddress(tx.hash, 6)}
        </a>
      </td>
      <td className="py-2.5 px-3 mono text-xs text-[#6b6975]">{tx.ledger.toLocaleString()}</td>
      <td className="py-2.5 px-3 mono text-xs text-[#6b6975]">
        <Link href={`/accounts/${tx.sourceAccount}`} className="hover:text-[#7c3aed] hover:underline transition-colors">
          {truncateAddress(tx.sourceAccount)}
        </Link>
      </td>
      <td className="py-2.5 px-3">
        <span className="text-[11px] bg-[#f6f5f8] text-[#6b6975] px-1.5 py-0.5 rounded">{tx.operationCount}</span>
      </td>
      <td className="py-2.5 px-3 mono text-xs text-[#a6a3b0]">{formatXLM(fee)} XLM</td>
      <td className="py-2.5 px-3 text-xs text-[#c3c1cb]">{timeAgo(tx.createdAt)}</td>
    </tr>
  );
}
