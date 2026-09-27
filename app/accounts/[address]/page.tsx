import { AccountDetailDocument as ACCOUNT_QUERY } from "@/lib/generated/graphql";
import Link from "next/link";
import type { Metadata } from "next";
import { gqlFetch, GRAPHQL_URL } from "@/lib/graphql";
import { accountOgImage, routeMetadata } from "@/lib/metadata";
import type { Account } from "@/lib/types";
import { formatXLM, truncateAddress } from "@/lib/formatters";
import CopyAddressButton from "@/components/CopyAddressButton";
import AccountActivityFeed from "@/components/AccountActivityFeed";
import AccountTransactionList from "@/components/AccountTransactionList";
import AccountOperationList from "@/components/AccountOperationList";
import BackendUnavailable from "@/components/BackendUnavailable";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

/**
 * Metadata for one account, from its address alone.
 *
 * The page itself fetches the account, but this does not: a share card is
 * fetched by bots that do not wait, and a title built from the URL is both
 * instant and always correct. The per-account image is generated from the same
 * address, so a shared link shows which account it is without either request
 * depending on the indexer being up.
 */
export function generateMetadata({ params }: { params: Promise<{ address: string }> }): Promise<Metadata> {
  return params.then(({ address }) => {
    const short = truncateAddress(address, 6);
    return routeMetadata({
      label: short,
      description: `Balances, transactions and live activity for the Stellar account ${address}, indexed on Lumina.`,
      path: `/accounts/${address}`,
      image: accountOgImage(address),
      imageAlt: `Stellar account ${short}`,
    });
  });
}

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
        transactionHash
        sourceAccount
        from
        to
        amount
        asset
      }
    }
  }
`;

async function getAccount(address: string): Promise<Account | null> {
  try {
    const data = await gqlFetch<{ account: Account | null }>(GRAPHQL_URL, ACCOUNT_QUERY, { address });
    return { account: data.account, unavailable: false };
  } catch {
    return { account: null, unavailable: true };
  }
}

export async function generateMetadata({ params }: { params: Promise<{ address: string }> }): Promise<Metadata> {
  const { address } = await params;
  return { title: `Account ${address} | Lumina`, description: `Stellar account ${address} and its indexed activity.` };
}

const th = "text-left text-[11px] tracking-[0.06em] uppercase text-[#a6a3b0] px-3 py-2.5 border-b border-[#e5e3ea] bg-[#fafafa]";
const stat = "bg-[#fafafa] border border-[#e5e3ea] rounded-xl p-4";
const statLabel = "text-[11px] text-[#a6a3b0] uppercase tracking-[0.05em]";
const statValue = "mono text-sm mt-1";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  const result = await getAccount(address);
  const account = result.account;

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
      <Link
        href="/explorer"
        className="inline-block text-[13px] font-semibold text-[#7c3aed] hover:text-[#6d28d9] mb-[18px]"
      >
        &larr; Back to Explorer
      </Link>
      {result.unavailable ? (
        <BackendUnavailable />
      ) : !account ? (
        <div className="p-8 rounded-xl border border-[#fecaca] text-center">
          <p className="text-[#dc2626] font-semibold mb-2">Account Not Found</p>
          <p className="text-[#a6a3b0] text-sm max-w-md mx-auto">
            The address{" "}
            <span className="mono text-[#6b6975] break-all">{address}</span>{" "}
            does not exist on Stellar Mainnet, or has never been funded.
          </p>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
            <h1 className="mono font-bold text-[22px] break-all text-[#0e0e12]">
              {account.address}
            </h1>
            <CopyAddressButton address={address} />
          </div>
          <p className="text-[#a6a3b0] text-[13px] mb-6">
            Last modified at ledger{" "}
            {account.lastModifiedLedger.toLocaleString()}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className={stat}>
              <div className={statLabel}>Sequence</div>
              <div className={statValue}>{account.sequence}</div>
            </div>
            <div className={stat}>
              <div className={statLabel}>Subentries</div>
              <div className={statValue}>{account.subentryCount}</div>
            </div>
            <div className={stat}>
              <div className={statLabel}>Sponsoring</div>
              <div className={statValue}>{account.numSponsoring}</div>
            </div>
            <div className={stat}>
              <div className={statLabel}>Sponsored</div>
              <div className={statValue}>{account.numSponsored}</div>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap mb-8">
            {flagTags.map((f) => (
              <span
                key={f}
                className="text-[11px] font-semibold rounded-full bg-[#f3effe] text-[#6d28d9] px-3 py-1"
              >
                {f}
              </span>
            ))}
          </div>

          <h2 className="font-extrabold text-base mb-3 text-[#0e0e12]">
            Balances
          </h2>
          <div className="rounded-xl border border-[#e5e3ea] overflow-hidden mb-9">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className={th}>Asset</th>
                  <th className={th}>Balance</th>
                  <th className={th}>Limit</th>
                </tr>
              </thead>
              <tbody>
                {account.balances.map((b, i) => (
                  <tr
                    key={i}
                    className="border-b border-[#f0eff3] last:border-0"
                  >
                    <td className="py-2.5 px-3 font-semibold text-[#0e0e12]">
                      {b.assetType === "native" ? "XLM" : b.assetCode}
                    </td>
                    <td className="py-2.5 px-3 mono text-[#0e0e12]">
                      {formatXLM(b.balance)}
                    </td>
                    <td className="py-2.5 px-3 mono text-[#a6a3b0] text-xs">
                      {b.limit ? formatXLM(b.limit) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <AccountActivityFeed address={account.address} />

          <h2 className="font-extrabold text-base mb-3 text-[#0e0e12]">
            Recent Transactions
          </h2>
          <AccountTransactionList
            address={account.address}
            initial={account.transactions ?? []}
          />

          <h2 className="font-extrabold text-base mt-9 mb-3 text-[#0e0e12]">
            Recent Operations
          </h2>
          <AccountOperationList
            address={account.address}
            initial={account.operations ?? []}
          />
        </div>
      )}
    </div>
  );
}
