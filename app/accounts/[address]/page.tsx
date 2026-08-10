import Link from "next/link";
import { gqlFetch, GRAPHQL_URL } from "@/lib/graphql";
import type { Account } from "@/lib/types";
import { timeAgo, formatXLM, truncateAddress } from "@/lib/formatters";
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

const th = "text-left text-[11px] tracking-[0.06em] uppercase text-[#a6a3b0] px-3 py-2.5 border-b border-[#e5e3ea] bg-[#fafafa]";
const stat = "bg-[#fafafa] border border-[#e5e3ea] rounded-xl p-4";
const statLabel = "text-[11px] text-[#a6a3b0] uppercase tracking-[0.05em]";
const statValue = "mono text-sm mt-1";

export default async function AccountPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const account = await getAccount(address);

  const flagTags = account
    ? [
        account.flags.authRequired && "Auth Required",
        account.flags.authRevocable && "Auth Revocable",
        account.flags.authImmutable && "Auth Immutable",
        account.flags.authClawbackEnabled && "Clawback Enabled",
      ].filter((f): f is string => Boolean(f))
    : [];
  if (account && flagTags.length === 0) flagTags.push("No Special Flags");

  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12">
      <Link href="/explorer" className="inline-block text-[13px] font-semibold text-[#7c3aed] hover:text-[#6d28d9] mb-[18px]">
        &larr; Back to Explorer
      </Link>
      {!account ? (
        <div className="p-8 rounded-xl border border-[#fecaca] text-center">
          <p className="text-[#dc2626] font-semibold mb-2">Account Not Found</p>
          <p className="text-[#a6a3b0] text-sm max-w-md mx-auto">The address <span className="mono text-[#6b6975] break-all">{address}</span> does not exist on Stellar Mainnet, or has never been funded.</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
            <h1 className="mono font-bold text-[22px] break-all text-[#0e0e12]">{account.address}</h1>
            <CopyAddressButton address={address} />
          </div>
          <p className="text-[#a6a3b0] text-[13px] mb-6">Last modified at ledger {account.lastModifiedLedger.toLocaleString()}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className={stat}><div className={statLabel}>Sequence</div><div className={statValue}>{account.sequence}</div></div>
            <div className={stat}><div className={statLabel}>Subentries</div><div className={statValue}>{account.subentryCount}</div></div>
            <div className={stat}><div className={statLabel}>Sponsoring</div><div className={statValue}>{account.numSponsoring}</div></div>
            <div className={stat}><div className={statLabel}>Sponsored</div><div className={statValue}>{account.numSponsored}</div></div>
          </div>

          <div className="flex gap-2 flex-wrap mb-8">
            {flagTags.map(f => (
              <span key={f} className="text-[11px] font-semibold rounded-full bg-[#f3effe] text-[#6d28d9] px-3 py-1">{f}</span>
            ))}
          </div>

          <h2 className="font-extrabold text-base mb-3 text-[#0e0e12]">Balances</h2>
          <div className="rounded-xl border border-[#e5e3ea] overflow-hidden mb-9">
            <table className="w-full text-sm border-collapse">
              <thead><tr><th className={th}>Asset</th><th className={th}>Balance</th><th className={th}>Limit</th></tr></thead>
              <tbody>
                {account.balances.map((b, i) => (
                  <tr key={i} className="border-b border-[#f0eff3] last:border-0">
                    <td className="py-2.5 px-3 font-semibold text-[#0e0e12]">{b.assetType === "native" ? "XLM" : b.assetCode}</td>
                    <td className="py-2.5 px-3 mono text-[#0e0e12]">{formatXLM(b.balance)}</td>
                    <td className="py-2.5 px-3 mono text-[#a6a3b0] text-xs">{b.limit ? formatXLM(b.limit) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="font-extrabold text-base mb-3 text-[#0e0e12]">Recent Transactions</h2>
          <div className="rounded-xl border border-[#e5e3ea] overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead><tr><th className={th}>Hash</th><th className={th}>Ledger</th><th className={th}>Ops</th><th className={th}>Time</th></tr></thead>
              <tbody>
                {account.transactions.map(tx => (
                  <tr key={tx.hash} className="border-b border-[#f0eff3] last:border-0">
                    <td className="py-2.5 px-3">
                      <a href={`https://stellar.expert/explorer/public/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="mono text-xs text-[#7c3aed] hover:text-[#6d28d9] hover:underline transition-colors">
                        {truncateAddress(tx.hash, 6)}
                      </a>
                    </td>
                    <td className="py-2.5 px-3 mono text-xs">{tx.ledger.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-xs">{tx.operationCount}</td>
                    <td className="py-2.5 px-3 text-xs text-[#c3c1cb]">{timeAgo(tx.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
