"use client";

/**
 * An account's operations, cursor-paginated.
 *
 * The root `operations` query filters by account and returns pageInfo, so this
 * is the explorer's pagination approach exactly: follow the cursor, accumulate
 * pages, dedupe by id, and say so when the list is truncated.
 */
import { useCallback, useState } from "react";
import { AccountOperationsDocument as ACCOUNT_OPERATIONS_QUERY } from "@/lib/generated/graphql";
import { gqlFetch, PUBLIC_GRAPHQL_URL } from "@/lib/graphql";
import { useAbortScope } from "@/lib/useAbortScope";
import type { Operation } from "@/lib/types";
import { formatOperationType, truncateAddress } from "@/lib/formatters";
import TimeAgo from "./TimeAgo";
import LoadMoreFooter from "./LoadMoreFooter";
import { t } from "@/lib/i18n";

const PAGE_SIZE = 25;
/** Matches the seed the server component renders. */
const SEED_LIMIT = 10;

const th =
  "text-left text-[11px] tracking-[0.06em] uppercase text-[var(--color-text-muted)] px-3 py-2.5 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]";

export default function AccountOperationList({
  address,
  initial,
}: {
  address: string;
  initial: Operation[];
}) {
  const [rows, setRows] = useState(initial);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(initial.length >= SEED_LIMIT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keyed on the account: a page requested for one address is never applied to
  // another, and neither is one that arrives after the component is gone.
  const scope = useAbortScope(address);

  const loadMore = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    const req = scope.next();
    try {
      const data = await gqlFetch(
        PUBLIC_GRAPHQL_URL,
        ACCOUNT_OPERATIONS_QUERY,
        { address, limit: PAGE_SIZE, cursor },
        { signal: req.signal },
      );
      if (!req.isCurrent()) return;
      const page = data.operations;

      setRows((prev) => {
        const seen = new Set(prev.map((op) => op.id));
        // A cursor page can overlap the previous one when operations are
        // indexed between requests; an id already shown is never rendered twice.
        return [...prev, ...page.items.filter((op) => !seen.has(op.id))];
      });
      setCursor(page.pageInfo.cursor);
      setHasNextPage(
        page.pageInfo.hasNextPage && page.pageInfo.cursor !== null,
      );
    } catch {
      if (!req.isCurrent()) return;
      setError(t("accountOps.couldNotLoad"));
      // Stop the button from immediately retrying in a tight loop; the
      // footer's Retry puts the user back in control.
      setHasNextPage(false);
    } finally {
      setLoading(false);
    }
  }, [scope, address, cursor, loading]);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        {t("accountOps.noOperations")}
      </p>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3 text-[13px] text-[var(--color-text-secondary)]">
        <span data-testid="operation-count">
          {hasNextPage
            ? t("accountOps.showingRecent", { count: rows.length })
            : t("accountOps.allOperations", { count: rows.length })}
        </span>
      </div>

      <div
        role="region"
        aria-label="Account operations"
        aria-busy={loading || undefined}
        tabIndex={0}
        className="rounded-xl border border-[var(--color-border-default)] overflow-x-auto"
      >
        <table className="w-full text-sm border-collapse">
          <caption className="sr-only">Account operations</caption>
          <thead>
            <tr>
              <th scope="col" className={th}>
                Type
              </th>
              <th scope="col" className={th}>
                Transaction
              </th>
              <th scope="col" className={th}>
                Detail
              </th>
              <th scope="col" className={th}>
                Time
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((op) => (
              <tr
                key={op.id}
                className="border-b border-[var(--color-bg-overlay)] last:border-0"
              >
                <td className="py-2.5 px-3">
                  <span className="text-[10px] font-bold rounded-full bg-[var(--color-accent-surface)] text-[var(--color-accent-text)] px-2 py-0.5">
                    {formatOperationType(op.type.toLowerCase())}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <a
                    href={`https://stellar.expert/explorer/public/tx/${op.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mono text-xs text-[var(--color-accent-text)] hover:text-[var(--color-accent-text-hover)] hover:underline transition-colors"
                  >
                    {truncateAddress(op.transactionHash, 6)}
                  </a>
                </td>
                <td className="py-2.5 px-3 text-xs text-[var(--color-text-primary)]">
                  {op.amount ? (
                    <span className="mono">
                      {op.amount} {op.asset ?? "XLM"}
                    </span>
                  ) : op.from && op.to ? (
                    <span className="mono text-[var(--color-text-secondary)]">
                      {truncateAddress(op.from, 4)} →{" "}
                      {truncateAddress(op.to, 4)}
                    </span>
                  ) : op.from || op.to ? (
                    <span className="mono text-[var(--color-text-secondary)]">
                      {truncateAddress(op.from ?? op.to ?? "", 4)}
                    </span>
                  ) : (
                    <span className="text-[var(--color-text-muted)]">—</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-xs text-[var(--color-text-faint)]">
                  <TimeAgo isoString={op.createdAt} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <LoadMoreFooter
        loading={loading}
        error={error}
        hasMore={hasNextPage}
        endLabel={t("accountOps.endOfResults")}
        onLoadMore={loadMore}
      />
    </>
  );
}
