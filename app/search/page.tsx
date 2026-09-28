import type { Metadata } from "next";
import Link from "next/link";
import { gqlFetch, GRAPHQL_URL } from "@/lib/graphql";
import { routeMetadata } from "@/lib/metadata";
import { SEARCH } from "@/lib/routes";
import type { Transaction } from "@/lib/types";
import BackendUnavailable from "@/components/BackendUnavailable";
import TransactionRow from "@/components/TransactionRow";

export const dynamic = "force-dynamic";

export const metadata: Metadata = routeMetadata(SEARCH);

/**
 * The same selection set as the transactions table, so a result row is
 * directly renderable by the shared `TransactionRow`.
 */
const SEARCH_QUERY = `
  query MemoSearch($query: String!) {
    search(query: $query, limit: 20) {
      items {
        hash
        ledger
        createdAt
        sourceAccount
        feeCharged
        operationCount
        successful
        memoType
        memo
      }
    }
  }
`;

async function searchMemo(query: string): Promise<{
  items: Transaction[];
  unavailable: boolean;
}> {
  try {
    const data = await gqlFetch<{ search: { items: Transaction[] } }>(
      GRAPHQL_URL,
      SEARCH_QUERY,
      { query },
    );
    return { items: data.search.items, unavailable: false };
  } catch {
    return { items: [], unavailable: true };
  }
}

const th =
  "text-left text-[11px] tracking-[0.06em] uppercase text-[var(--color-text-muted)] px-3 py-2.5 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  // No query: the page doubles as documentation of what the one search box
  // understands, so landing here without one explains the four shapes rather
  // than showing an empty table.
  if (!query) {
    return (
      <div className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12">
        <h1 className="font-extrabold text-3xl mb-2 text-[var(--color-text-primary)]">Search</h1>
        <p className="text-[var(--color-text-secondary)] mb-7">
          One box for everything on the network. Type what you have — no need to
          say what it is.
        </p>
        <div className="rounded-xl border border-[var(--color-border-default)] overflow-hidden max-w-[640px]">
          <table className="w-full text-sm border-collapse">
            <tbody>
              <tr className="border-b border-[var(--color-bg-overlay)]">
                <td className="py-2.5 px-3 mono text-xs text-[var(--color-accent-text)] w-[170px]">
                  G… (56 chars)
                </td>
                <td className="py-2.5 px-3 text-[var(--color-text-primary)]">Account address</td>
              </tr>
              <tr className="border-b border-[var(--color-bg-overlay)]">
                <td className="py-2.5 px-3 mono text-xs text-[var(--color-accent-text)]">
                  C… (56 chars)
                </td>
                <td className="py-2.5 px-3 text-[var(--color-text-primary)]">
                  Contract id — its events
                </td>
              </tr>
              <tr className="border-b border-[var(--color-bg-overlay)]">
                <td className="py-2.5 px-3 mono text-xs text-[var(--color-accent-text)]">
                  64 hex chars
                </td>
                <td className="py-2.5 px-3 text-[var(--color-text-primary)]">Transaction hash</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 mono text-xs text-[var(--color-accent-text)]">
                  anything else
                </td>
                <td className="py-2.5 px-3 text-[var(--color-text-primary)]">
                  Memo search, ranked by the backend
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
      <h1 className="font-extrabold text-3xl mb-2 text-[var(--color-text-primary)]">Search</h1>
      <p className="text-[var(--color-text-secondary)] mb-7">
        {unavailable
          ? "Searching the index…"
          : `${items.length} transaction${items.length === 1 ? "" : "s"} matching `}
        {!unavailable && (
          <>
            <span className="mono text-[var(--color-text-primary)]">“{query}”</span>, ranked by
            memo relevance.
          </>
        )}
      </p>

      {unavailable ? (
        <BackendUnavailable />
      ) : items.length === 0 ? (
        <div className="p-8 rounded-xl border border-[var(--color-border-default)] text-center">
          <p className="text-[var(--color-text-muted)] text-sm">
            No transactions carry anything like this memo. Memo search matches
            order references and short codes — try a few characters of it.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--color-border-default)] overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className={`${th} w-6`} />
                <th className={th}>Hash</th>
                <th className={th}>Ledger</th>
                <th className={th}>Source</th>
                <th className={th}>Ops</th>
                <th className={th}>Fee</th>
                <th className={th}>Time</th>
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
        Looking for an account or contract? Paste its full address —{" "}
        <Link href="/explorer" className="text-[var(--color-accent-text)] hover:underline">
          the explorer
        </Link>{" "}
        takes you straight there.
      </p>
    </div>
  );
}
