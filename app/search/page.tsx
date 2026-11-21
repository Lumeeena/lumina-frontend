
import type { Metadata } from "next";
import { MemoSearchDocument as SEARCH_QUERY } from "@/lib/generated/graphql";
import Link from "next/link";
import { gqlFetch, GRAPHQL_URL } from "@/lib/graphql";
import { routeMetadata } from "@/lib/metadata";
import { SEARCH } from "@/lib/routes";
import type { MemoSearchQuery } from "@/lib/generated/graphql";
import BackendUnavailable from "@/components/BackendUnavailable";
import TransactionRow from "@/components/TransactionRow";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return routeMetadata(SEARCH);
}

/**
 * The same selection set as the transactions table, so a result row is
 * directly renderable by the shared TransactionRow.
 */
async function searchMemo(query: string): Promise<{
  items: MemoSearchQuery["search"]["items"];
  unavailable: boolean;
}> {
  try {
    const data = await gqlFetch(GRAPHQL_URL, SEARCH_QUERY, { query });
    return { items: data.search.items, unavailable: false };
  } catch {
    return { items: [], unavailable: true };
  }
}

const th =
  "text-start text-[11px] tracking-[0.06em] uppercase text-[var(--color-text-muted)] px-3 py-2.5 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  if (!query) {
    return (
      <div className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12">
        <h1 className="font-extrabold text-3xl mb-2 text-[var(--color-text-primary)]">
          {t("search.heading")}
        </h1>

        <p className="text-[var(--color-text-secondary)] mb-7">
          {t("search.description")}
        </p>

        <div className="rounded-xl border border-[var(--color-border-default)] overflow-hidden max-w-[640px]">
          <table className="w-full text-sm border-collapse">
            <tbody>
              <tr className="border-b border-[var(--color-bg-overlay)]">
                <td className="py-2.5 px-3 mono text-xs text-[var(--color-accent-text)] w-[170px]">
                  G… (56 chars)
                </td>
                <td className="py-2.5 px-3 text-[var(--color-text-primary)]">
                  {t("search.accountAddress")}
                </td>
              </tr>

              <tr className="border-b border-[var(--color-bg-overlay)]">
                <td className="py-2.5 px-3 mono text-xs text-[var(--color-accent-text)]">
                  C… (56 chars)
                </td>
                <td className="py-2.5 px-3 text-[var(--color-text-primary)]">
                  {t("search.contractId")}
                </td>
              </tr>

              <tr className="border-b border-[var(--color-bg-overlay)]">
                <td className="py-2.5 px-3 mono text-xs text-[var(--color-accent-text)]">
                  64 hex chars
                </td>
                <td className="py-2.5 px-3 text-[var(--color-text-primary)]">
                  {t("search.transactionHash")}
                </td>
              </tr>

              <tr>
                <td className="py-2.5 px-3 mono text-xs text-[var(--color-accent-text)]">
                  {t("common.search")}
                </td>
                <td className="py-2.5 px-3 text-[var(--color-text-primary)]">
                  {t("search.memoSearch")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const { items, unavailable } = await searchMemo(query);

  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12">
      <h1 className="font-extrabold text-3xl mb-2 text-[var(--color-text-primary)]">
        {t("search.heading")}
      </h1>

      <p className="text-[var(--color-text-secondary)] mb-7">
        {unavailable ? (
          t("search.searching")
        ) : (
          <>
            {t("search.resultsCount", { count: items.length })}{" "}
            <span className="mono break-all text-[var(--color-text-primary)]">
              “{query}”
            </span>
            {t("search.rankedByMemo")}
          </>
        )}
      </p>

      {unavailable ? (
        <BackendUnavailable />
      ) : items.length === 0 ? (
        <div className="p-8 rounded-xl border border-[var(--color-border-default)] text-center">
          <p className="text-[var(--color-text-muted)] text-sm">
            {t("search.noMemoMatch")}
          </p>
        </div>
      ) : (
        <div
          role="region"
          aria-label={t("search.heading")}
          tabIndex={0}
          className="max-w-full rounded-xl border border-[var(--color-border-default)] overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-fill)]"
        >
          <table className="w-full min-w-[720px] text-sm border-collapse">
            <caption className="sr-only">
              {t("search.heading")}
            </caption>

            <thead>
              <tr>
                <th scope="col" className={`${th} w-6`} />
                <th scope="col" className={th}>
                  {t("table.hash")}
                </th>
                <th scope="col" className={th}>
                  {t("table.ledger")}
                </th>
                <th scope="col" className={th}>
                  {t("table.source")}
                </th>
                <th scope="col" className={th}>
                  {t("table.ops")}
                </th>
                <th scope="col" className={th}>
                  {t("table.fee")}
                </th>
                <th scope="col" className={th}>
                  {t("table.time")}
                </th>
              </tr>
            </thead>

            <tbody>
              {items.map((tx) => (
                <TransactionRow key={tx.hash} tx={tx} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[var(--color-text-muted)] text-xs mt-4">
        {t("search.helpTextBeforeLink")}
        <Link
          href="/explorer"
          className="text-[var(--color-accent-text)] hover:underline"
        >
          {t("search.explorerLink")}
        </Link>
        {t("search.helpTextAfterLink")}
      </p>
    </div>
  );
}
