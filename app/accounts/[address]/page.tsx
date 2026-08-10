import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { gqlFetch, GRAPHQL_URL } from "@/lib/graphql";
import type { Account } from "@/lib/types";
import { timeAgo, formatXLM, formatOperationType, getOperationColor } from "@/lib/formatters";
import TransactionRow from "@/components/TransactionRow";
import CopyAddressButton from "@/components/CopyAddressButton";

export const dynamic = 'force-dynamic';

const ACCOUNT_QUERY = `
  query AccountDetail($address: String!) {
    account(address: $address) {
      address
      sequence
      subentryCount
      lastModifiedLedger
      numSponsored
      numSponsoring
      balances { assetType assetCode assetIssuer balance limit }
      flags { authRequired authRevocable authImmutable authClawbackEnabled }
      transactions(limit: 10) {
        hash
        ledger
        createdAt
        sourceAccount
        feeCharged
        operationCount
        successful
      }
      operations(limit: 10) {
        id
        type
        createdAt
      }
    }
  }
`;

async function getAccount(address: string): Promise<Account | null> {
  try {
    const data = await gqlFetch<{ account: Account | null }>(GRAPHQL_URL, ACCOUNT_QUERY, { address });
    return data.account;
  } catch {
    return null;
  }
}

export default async function AccountPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const account = await getAccount(address);

  const xlmBalance = account?.balances.find(b => b.assetType === "native");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <Link href="/explorer" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 mb-8 transition-colors">
        <ArrowLeft size={14} /> Back to Explorer
      </Link>

      {!account ? (
        <div className="p-8 rounded-xl bg-[#0c1222] border border-red-900/50 text-center">
          <p className="text-red-400 font-semibold mb-2">Account Not Found</p>
          <p className="text-slate-500 text-sm max-w-md mx-auto">The address <span className="mono text-slate-300 break-all">{address}</span> does not exist on Stellar Mainnet, or has never been funded.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="p-5 rounded-xl bg-[#0c1222] border border-[#162032]">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div><div className="text-sm text-slate-500 mb-1">Account</div><div className="mono text-sm text-white break-all">{address}</div></div>
              <CopyAddressButton address={address} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><div className="text-slate-500 text-xs mb-1">XLM Balance</div><div className="text-white font-semibold">{formatXLM(xlmBalance?.balance ?? "0")} XLM</div></div>
              <div><div className="text-slate-500 text-xs mb-1">Sequence</div><div className="text-white mono text-xs">{account.sequence}</div></div>
              <div><div className="text-slate-500 text-xs mb-1">Subentries</div><div className="text-white">{account.subentryCount}</div></div>
              <div><div className="text-slate-500 text-xs mb-1">Trustlines</div><div className="text-white">{account.balances.filter(b => b.assetType !== "native").length}</div></div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-[#0c1222] border border-[#162032]">
            <h2 className="font-semibold text-white mb-3">Flags</h2>
            <div className="flex gap-3 flex-wrap">
              {[
                { label: "Auth Required", value: account.flags.authRequired },
                { label: "Auth Revocable", value: account.flags.authRevocable },
                { label: "Auth Immutable", value: account.flags.authImmutable },
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
                        <td className="py-2 pr-6 font-semibold text-white">{b.assetType === "native" ? "XLM" : b.assetCode}</td>
                        <td className="py-2 pr-6 mono text-slate-300">{formatXLM(b.balance)}</td>
                        <td className="py-2 mono text-slate-500 text-xs">{b.limit ? formatXLM(b.limit) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {account.transactions.length > 0 && (
            <div className="p-5 rounded-xl bg-[#0c1222] border border-[#162032]">
              <h2 className="font-semibold text-white mb-4">Recent Transactions</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs text-slate-500 border-b border-[#162032] uppercase"><th className="pb-2 w-6" /><th className="pb-2 pr-4">Hash</th><th className="pb-2 pr-4">Ledger</th><th className="pb-2 pr-4">Source</th><th className="pb-2 pr-4">Ops</th><th className="pb-2 pr-4">Fee</th><th className="pb-2">Time</th></tr></thead>
                  <tbody>{account.transactions.map(tx => <TransactionRow key={tx.hash} tx={tx} />)}</tbody>
                </table>
              </div>
            </div>
          )}

          {account.operations.length > 0 && (
            <div className="p-5 rounded-xl bg-[#0c1222] border border-[#162032]">
              <h2 className="font-semibold text-white mb-4">Recent Operations</h2>
              <div className="flex flex-col gap-2">
                {account.operations.map(op => (
                  <div key={op.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#060d18] border border-[#162032]">
                    <span className={`text-xs font-semibold ${getOperationColor(op.type.toLowerCase())}`}>{formatOperationType(op.type.toLowerCase())}</span>
                    <span className="text-xs text-slate-500 mono ml-auto">{timeAgo(op.createdAt)}</span>
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
