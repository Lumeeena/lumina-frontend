import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { routeMetadata } from "@/lib/metadata";
import { gqlFetch, GRAPHQL_URL } from "@/lib/graphql";
import {
  AccountsListDocument as ACCOUNTS_QUERY,
  type AccountsListQuery,
} from "@/lib/generated/graphql";
import { truncateAddress } from "@/lib/formatters";
import BackendUnavailable from "@/components/BackendUnavailable";
import Breadcrumbs from "@/components/Breadcrumbs";
import Link from "next/link";
import TimeAgo from "@/components/TimeAgo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = routeMetadata({
  path: "/accounts",
  label: "Accounts",
  description:
    "Browse Stellar accounts indexed by this Lumina deployment, ordered by recent activity.",
});

const PAGE_SIZE = 25;

type AccountSummary = AccountsListQuery["accounts"]["items"][number];

const th =
  "text-left text-[11px] tracking-[0.06em] uppercase text-[var(--color-text-muted)] px-3 py-2.5 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]";

async function getAccounts(
  cursor?: string,
): Promise<{ items: AccountSummary[]; pageInfo: { hasNextPage: boolean; cursor: string | null }; unavailable: boolean }> {
  try {
    const data = await gqlFetch(GRAPHQL_URL, ACCOUNTS_QUERY, {
      limit: PAGE_SIZE,
      cursor: cursor ?? null,
    });
    return { ...data.accounts, unavailable: false };
  } catch {
    return { items: [], pageInfo: { hasNextPage: false, cursor: null }, unavailable: true };
  }
}

export default async function AccountsIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ address?: string; cursor?: string }>;
}) {
  const { address, cursor } = await searchParams;

  if (address && address.trim()) {
    redirect(`/accounts/${address.trim()}`);
  }

  const { items, pageInfo, unavailable } = await getAccounts(cursor);

  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12">
      <Breadcrumbs
        items={[
          { label: "Explorer", href: "/explorer" },
          { label: "Accounts" },
        ]}
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
          Accounts
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] max-w-2xl">
          Accounts indexed by this Lumina deployment, ordered by most recent
          activity. This list covers accounts the indexer has seen on the
          network — not every account on Stellar.
        </p>
      </div>

      {unavailable ? (
        <BackendUnavailable />
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] p-8 text-center">
          <p className="text-[var(--color-text-muted)] text-sm">
            No accounts indexed yet. The indexer has not seen any account
            activity on this network.
          </p>
        </div>
      ) : (
        <>
          <div
            role="region"
            aria-label="Accounts list"
            tabIndex={0}
            className="rounded-xl border border-[var(--color-border-default)] overflow-x-auto mb-6"
          >
            <table className="w-full text-sm border-collapse">
              <caption className="sr-only">Indexed Stellar accounts</caption>
              <thead>
                <tr>
                  <th scope="col" className={th}>Address</th>
                  <th scope="col" className={th}>Sequence</th>
                  <th scope="col" className={th}>Subentries</th>
                  <th scope="col" className={th}>Last Modified</th>
                </tr>
              </thead>
              <tbody>
                {items.map((account) => (
                  <tr
                    key={account.address}
                    className="border-b border-[var(--color-bg-overlay)] last:border-0 hover:bg-[var(--color-bg-subtle)] transition-colors"
                  >
                    <td className="py-2.5 px-3">
                      <Link
                        href={`/accounts/${account.address}`}
                        className="mono text-xs font-semibold text-[var(--color-accent-text)] hover:text-[var(--color-accent-text-hover)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-fill)]"
                      >
                        {truncateAddress(account.address, 8)}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 mono text-xs text-[var(--color-text-secondary)]">
                      {account.sequence}
                    </td>
                    <td className="py-2.5 px-3 mono text-xs text-[var(--color-text-secondary)]">
                      {account.subentryCount}
                    </td>
                    <td className="py-2.5 px-3 mono text-xs text-[var(--color-text-muted)]">
                      {account.lastModifiedLedger.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-[var(--color-text-muted)]">
              Showing {items.length} account{items.length !== 1 ? "s" : ""}
            </p>
            <div className="flex gap-3">
              {cursor && (
                <Link
                  href="/accounts"
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border-default)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-raised)] transition-colors"
                >
                  ← First page
                </Link>
              )}
              {pageInfo.hasNextPage && pageInfo.cursor && (
                <Link
                  href={`/accounts?cursor=${encodeURIComponent(pageInfo.cursor)}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-accent-fill)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  Next →
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
