import type { HorizonTransaction } from "@/lib/horizon";
import { truncateAddress, timeAgo, formatXLM } from "@/lib/formatters";
import { CheckCircle, XCircle } from "lucide-react";

export default function TransactionRow({ tx }: { tx: HorizonTransaction }) {
  const fee = (parseInt(tx.fee_charged) / 1e7).toFixed(7);
  return (
    <tr className="border-b border-[#0f1a28] hover:bg-[#0c1222] transition-colors">
      <td className="py-3 pr-4">
        {tx.successful
          ? <CheckCircle size={14} className="text-green-400" />
          : <XCircle size={14} className="text-red-400" />}
      </td>
      <td className="py-3 pr-4">
        <a
          href={`https://stellar.expert/explorer/public/tx/${tx.hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mono text-xs text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
          title={tx.hash}
        >
          {truncateAddress(tx.hash, 6)}
        </a>
      </td>
      <td className="py-3 pr-4 mono text-xs text-slate-500">{tx.ledger.toLocaleString()}</td>
      <td className="py-3 pr-4 mono text-xs text-slate-400">{truncateAddress(tx.source_account)}</td>
      <td className="py-3 pr-4">
        <span className="px-1.5 py-0.5 rounded bg-[#162032] text-xs text-slate-400">{tx.operation_count}</span>
      </td>
      <td className="py-3 pr-4 mono text-xs text-slate-500">{formatXLM(fee)} XLM</td>
      <td className="py-3 text-xs text-slate-600">{timeAgo(tx.created_at)}</td>
    </tr>
  );
}
