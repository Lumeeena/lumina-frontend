'use client';

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, CheckCircle } from "lucide-react";
import { getAccount, getAccountTransactions, getAccountOperations, HorizonAccount, HorizonTransaction, HorizonOperation } from "@/lib/horizon";
import { timeAgo, formatXLM, formatOperationType, getOperationColor } from "@/lib/formatters";
import TransactionRow from "@/components/TransactionRow";

export default function AccountPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = use(params);
  const [account, setAccount] = useState<HorizonAccount | null>(null);
  const [txs, setTxs] = useState<HorizonTransaction[]>([]);
  const [ops, setOps] = useState<HorizonOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      getAccount(address),
      getAccountTransactions(address),
      getAccountOperations(address),
    ]).then(([acc, t, o]) => {
      setAccount(acc);
      setTxs(t);
      setOps(o);
      setLoading(false);
    });
  }, [address]);

  function copyAddress() {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const xlmBalance = account?.balances.find(b => b.asset_type === "native");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <Link href="/explorer" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 mb-8 transition-colors">
        <ArrowLeft size={14} /> Back to Explorer
      </Link>

      {loading ? (
        <div className="text-slate-500 text-sm">Loading account data from Stellar Horizon...</div>
      ) : !account ? (
        <div className="p-8 rounded-xl bg-[#0c1222] border border-red-900/50 text-center">
          <p className="text-red-400 font-semibold mb-2">Account Not Found</p>
          <p className="text-slate-500 text-sm max-w-md mx-auto">The address <span className="mono text-slate-300 break-all">{address}</span> does not exist on Stellar Mainnet, or has never been funded.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="p-5 rounded-xl bg-[#0c1222] border border-[#162032]">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div><div className="text-sm text-slate-500 mb-1">Account</div><div className="mono text-sm text-white break-all">{address}</div></div>
              <button onClick={copyAddress} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-400 transition-colors shrink-0">
                {copied ? <CheckCircle size={13} className="text-green-400" /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><div className="text-slate-500 text-xs mb-1">XLM Balance</div><div className="text-white font-semibold">{formatXLM(xlmBalance?.balance ?? "0")} XLM</div></div>
              <div><div className="text-slate-500 text-xs mb-1">Sequence</div><div className="text-white mono text-xs">{account.sequence}</div></div>
              <div><div className="text-slate-500 text-xs mb-1">Subentries</div><div className="text-white">{account.subentry_count}</div></div>
              <div><div className="text-slate-500 text-xs mb-1">Trustlines</div><div className="text-white">{account.balances.filter(b => b.asset_type !== "native").length}</div></div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[#0c1222] border border-[#162032]">
            <h2 className="font-semibold text-white mb-3">Flags</h2>
            <div className="flex gap-3 flex-wrap">
              {[
                { label: "Auth Required", value: account.flags.auth_required },
                { label: "Auth Revocable", value: account.flags.auth_revocable },
                { label: "Auth Immutable", value: account.flags.auth_immutable },
              ].map(flag => (
                <span key={flag.label} className={`text-xs px-2.5 py-1 rounded-full border ${flag.value ? "bg-amber-900/30 border-amber-700 text-amber-300" : "bg-[#162032] border-[#1e2d40] text-slate-500"}`}>
                  {flag.label}: {flag.value ? "On" : "Off"}
                </span>
              ))}
            </div>
          </div>

          {account.balances.length > 0 && (
            <div className="p-5 rounded-xl bg-[#0c1222] border border-[#162032]">
              <h2 className="font-semibold text-white mb-4">Asset Balances</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-xs text-slate-500 text-left border-b border-[#162032] uppercase"><th className="pb-2 pr-6">Asset</th><th className="pb-2 pr-6">Balance</th><th className="pb-2">Limit</th></tr></thead>
                  <tbody>
                    {account.balances.map((b, i) => (
                      <tr key={i} className="border-b border-[#0f1a28] last:border-0">
                        <td className="py-2 pr-6 font-semibold text-white">{b.asset_type === "native" ? "XLM" : b.asset_code}</td>
                        <td className="py-2 pr-6 mono text-slate-300">{formatXLM(b.balance)}</td>
                        <td className="py-2 mono text-slate-500 text-xs">{b.limit ? formatXLM(b.limit) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {txs.length > 0 && (
            <div className="p-5 rounded-xl bg-[#0c1222] border border-[#162032]">
              <h2 className="font-semibold text-white mb-4">Recent Transactions</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs text-slate-500 border-b border-[#162032] uppercase"><th className="pb-2 w-6" /><th className="pb-2 pr-4">Hash</th><th className="pb-2 pr-4">Ledger</th><th className="pb-2 pr-4">Source</th><th className="pb-2 pr-4">Ops</th><th className="pb-2 pr-4">Fee</th><th className="pb-2">Time</th></tr></thead>
                  <tbody>{txs.map(tx => <TransactionRow key={tx.id} tx={tx} />)}</tbody>
                </table>
              </div>
            </div>
          )}

          {ops.length > 0 && (
            <div className="p-5 rounded-xl bg-[#0c1222] border border-[#162032]">
              <h2 className="font-semibold text-white mb-4">Recent Operations</h2>
              <div className="flex flex-col gap-2">
                {ops.map(op => (
                  <div key={op.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#060d18] border border-[#162032]">
                    <span className={`text-xs font-semibold ${getOperationColor(op.type)}`}>{formatOperationType(op.type)}</span>
                    <span className="text-xs text-slate-500 mono ml-auto">{timeAgo(op.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
