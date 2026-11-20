import type { Metadata } from "next";
import Link from "next/link";
import {
  LedgersListDocument as LEDGERS_QUERY,
  type LedgersListQuery,
} from "@/lib/generated/graphql";
import { gqlFetch, GRAPHQL_URL } from "@/lib/graphql";
import { findLedgerGaps } from "@/lib/ledgerGaps";
import { routeMetadata } from "@/lib/metadata";
import { LEDGERS } from "@/lib/routes";
import BackendUnavailable from "@/components/BackendUnavailable";
import IndexingGapIndicator from "@/components/IndexingGapIndicator";
import TimeAgo from "@/components/TimeAgo";

export const dynamic = "force-dynamic";

/**
 * `?cursor=` is not in the canonical URL: every page of the walk is a view of
 * the one `/ledgers` collection, and the crawl-exclusion rule in lib/routes.ts
 * already keeps query permutations out of the sitemap.
 */
export const metadata: Metadata = routeMetadata(LEDGERS);

const PAGE_SIZE = 25;

type LedgerPage = LedgersListQuery["ledgers"];

async function getLedgers(
  cursor?: string,
): Promise<LedgerPage & { unavailable: boolean }> {
  try {
    const data = await gqlFetch(GRAPHQL_URL, LEDGERS_QUERY, {
      limit: PAGE_SIZE,
      cursor: cursor ?? null,
    });
    return { ...data.ledgers, unavailable: false };
  } catch {
    return {
      items: [],
      pageInfo: { hasNextPage: false, cursor: null },
      unavailable: true,
    };
  }
}

const th =
  "text-left text-[11px] tracking-[0.06em] uppercase text-[var(--color-text-muted)] px-3 py-2.5 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]";
const cell = "py-2.5 px-3 mono text-xs text-[var(--color-text-secondary)]";

export default async function LedgersPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string }>;
}) {
  const { cursor } = await searchParams;
  const { items, pageInfo, unavailable } = await getLedgers(cursor);

  const sequences = items.map((ledger) => ledger.sequence);
  const gaps = findLedgerGaps(sequences);

  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12">
      <h1 className="font-extrabold text-3xl mb-2 text-[var(--color-text-primary)]">
        Ledgers
      </h1>
      <p className="text-[var(--color-text-secondary)] mb-7 max-w-2xl">
        Ledgers this Lumina deployment has indexed, newest first. A ledger the
        indexer has not reached yet is not listed.
      </p>

      {unavailable ? (
        <BackendUnavailable />
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] p-8 text-center">
          <p className="text-[var(--color-text-muted)] text-sm">
            {/* An empty page after a cursor is how the API reports the end of
                the walk, not an empty index. */}
            {cursor
              ? "No older ledgers are indexed."
              : "No ledgers indexed yet. The indexer has not processed any ledgers on this network."}
          </p>
          {cursor && (
            <Link
              href={LEDGERS.path}
              className="inline-block mt-3 text-sm font-semibold text-[var(--color-accent-text)] hover:text-[var(--color-accent-text-hover)]"
            >
              ← Back to the newest ledgers
            </Link>
          )}
        </div>
      ) : (
        <>
          <IndexingGapIndicator
            gaps={gaps}
            viewedLedgerStart={Math.min(...sequences)}
            viewedLedgerEnd={Math.max(...sequences)}
          />

          <div
            role="region"
            aria-label="Ledgers list"
            tabIndex={0}
            className="rounded-xl border border-[var(--color-border-default)] overflow-x-auto mb-6"
          >
            <table className="w-full text-sm border-collapse">
              <caption className="sr-only">
                Indexed Stellar ledgers, newest first
              </caption>
              <thead>
                <tr>
                  <th scope="col" className={th}>
                    Sequence
                  </th>
                  <th scope="col" className={th}>
                    Closed
                  </th>
                  <th scope="col" className={th}>
                    Transactions
                  </th>
                  <th scope="col" className={th}>
                    Operations
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((ledger) => (
                  <tr
                    key={ledger.sequence}
                    className="border-b border-[var(--color-bg-overlay)] last:border-0 hover:bg-[var(--color-bg-subtle)] transition-colors"
                  >
                    <td className="py-2.5 px-3">
                      <Link
                        href={`/ledgers/${ledger.sequence}`}
                        className="mono text-xs font-semibold text-[var(--color-accent-text)] hover:text-[var(--color-accent-text-hover)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-fill)]"
                      >
                        {ledger.sequence}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-[var(--color-text-muted)]">
                      <TimeAgo isoString={ledger.closedAt} />
                    </td>
                    <td className={cell}>{ledger.transactionCount}</td>
                    <td className={cell}>{ledger.operationCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-[var(--color-text-muted)]">
              Showing {items.length} ledger{items.length !== 1 ? "s" : ""}
            </p>
            <div className="flex gap-3">
              {cursor && (
                <Link
                  href={LEDGERS.path}
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border-default)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-raised)] transition-colors"
                >
                  ← Newest
                </Link>
              )}
              {pageInfo.hasNextPage && pageInfo.cursor && (
                <Link
                  href={`${LEDGERS.path}?cursor=${encodeURIComponent(pageInfo.cursor)}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-accent-fill)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  Older →
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
