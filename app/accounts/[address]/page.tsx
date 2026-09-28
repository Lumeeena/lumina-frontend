import type { Metadata } from "next";
import {
  AccountDetailDocument as ACCOUNT_QUERY,
  AccountTrustlineOpsDocument as TRUSTLINE_QUERY,
} from "@/lib/generated/graphql";
import { gqlFetch, GRAPHQL_URL } from "@/lib/graphql";
import { accountOgImage, routeMetadata } from "@/lib/metadata";
import type { Account, TrustlineOp } from "@/lib/types";
import { formatXLM, truncateAddress } from "@/lib/formatters";
import CopyAddressButton from "@/components/CopyAddressButton";
import WatchIndicator from "@/components/WatchIndicator";
import AccountActivityFeed from "@/components/AccountActivityFeed";
import AccountPortfolio from "@/components/AccountPortfolio";
import AccountTransactionList from "@/components/AccountTransactionList";
import AccountOperationList from "@/components/AccountOperationList";
import AccountTrustlineTimeline from "@/components/AccountTrustlineTimeline";
import BackendUnavailable from "@/components/BackendUnavailable";
import Breadcrumbs from "@/components/Breadcrumbs";

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

async function getAccount(address: string): Promise<{ account: Account | null; unavailable: boolean }> {
  try {
    const data = await gqlFetch(GRAPHQL_URL, ACCOUNT_QUERY, { address });
    return { account: data.account, unavailable: false };
  } catch {
    return { account: null, unavailable: true };
  }
}

const th = "text-start text-[11px] tracking-[0.06em] uppercase text-[var(--color-text-muted)] px-3 py-2.5 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]";
const stat = "bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] rounded-xl p-4";
const statLabel = "text-[11px] text-[var(--color-text-muted)] uppercase tracking-[0.05em]";
const statValue = "mono text-sm mt-1";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  const [result, trustlineOps] = await Promise.all([
    getAccount(address),
    getTrustlineOps(address),
  ]);
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
      <Breadcrumbs
        items={[
          { label: "Explorer", href: "/explorer" },
          { label: "Accounts", href: "/accounts" },
          { label: truncateAddress(address, 8) },
        ]}
      />
      {result.unavailable ? (
        <BackendUnavailable />
      ) : !account ? (
        <div className="p-8 rounded-xl border border-[var(--color-error-outline)] text-center">
          <p className="text-[var(--color-error-text)] font-semibold mb-2">Account Not Found</p>
          <p className="text-[var(--color-text-muted)] text-sm max-w-md mx-auto">
            The address{" "}
            <span className="mono text-[var(--color-text-secondary)] break-all">{address}</span>{" "}
            does not exist on Stellar Mainnet, or has never been funded.
          </p>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
            <h1 className="mono font-bold text-[22px] break-all text-[var(--color-text-primary)]">
              {account.address}
            </h1>
            <CopyAddressButton address={address} />
            <WatchIndicator address={address} />
          </div>
          <p className="text-[var(--color-text-muted)] text-[13px] mb-6">
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
                className="text-[11px] font-semibold rounded-full bg-[var(--color-accent-surface)] text-[var(--color-accent-text)] px-3 py-1"
              >
                {f}
              </span>
            ))}
          </div>

          <h2 className="font-extrabold text-base mb-3 text-[var(--color-text-primary)]">
            Balances
          </h2>
          <div className="rounded-xl border border-[var(--color-border-default)] overflow-x-auto mb-9">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className={th}>Asset</th>
                  <th className={th}>Issuer</th>
                  <th className={th}>Balance</th>
                  <th className={th}>Limit</th>
                </tr>
              </thead>
              <tbody>
                {account.balances
                  .slice()
                  .sort((a, b) => {
                    if (a.assetType === "native") return -1;
                    if (b.assetType === "native") return 1;
                    const aVal = parseFloat(a.balance) || 0;
                    const bVal = parseFloat(b.balance) || 0;
                    return bVal - aVal;
                  })
                  .map((b, i) => (
                    <tr
                      key={i}
                      className="border-b border-[var(--color-bg-overlay)] last:border-0"
                    >
                      <td className="py-2.5 px-3 font-semibold text-[var(--color-text-primary)]">
                        {b.assetType === "native" ? "XLM" : b.assetCode}
                      </td>
                      <td className="py-2.5 px-3 mono text-[var(--color-text-muted)] text-xs max-w-xs truncate">
                        {b.assetType === "native" ? "—" : b.assetIssuer}
                      </td>
                      <td className="py-2.5 px-3 mono text-[var(--color-text-primary)]">
                        {formatXLM(b.balance)}
                      </td>
                      <td className="py-2.5 px-3 mono text-[var(--color-text-muted)] text-xs">
                        {b.limit ? formatXLM(b.limit) : "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {account.balances.length > 0 && (
            <AccountPortfolio balances={account.balances} />
          )}

          <AccountActivityFeed address={account.address} />

          <h2 className="font-extrabold text-base mb-3 text-[var(--color-text-primary)]">
            Recent Transactions
          </h2>
          <AccountTransactionList
            address={account.address}
            initial={account.transactions ?? []}
          />

          <h2 className="font-extrabold text-base mt-9 mb-3 text-[var(--color-text-primary)]">
            Recent Operations
          </h2>
          <AccountOperationList
            address={account.address}
            initial={account.operations ?? []}
          />

          <h2 className="font-extrabold text-base mt-9 mb-3 text-[var(--color-text-primary)]">
            Trustline History
          </h2>
          <AccountTrustlineTimeline
            address={account.address}
            initial={trustlineOps}
          />
        </div>
      )}
    </div>
  );
}
