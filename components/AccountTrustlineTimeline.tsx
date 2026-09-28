"use client";

/**
 * A chronological feed of change_trust operations for one account.
 *
 * Each entry shows what asset was trusted (or un-trusted), the trust limit,
 * and links out to the transaction on stellar.expert. The list is
 * cursor-paginated, following the same pattern as AccountOperationList.
 */
import { useCallback, useState } from "react";
import { AccountTrustlineOpsDocument as TRUSTLINE_QUERY } from "@/lib/generated/graphql";
import { gqlFetch, PUBLIC_GRAPHQL_URL } from "@/lib/graphql";
import { useAbortScope } from "@/lib/useAbortScope";
import type { TrustlineOp } from "@/lib/types";
import { truncateAddress } from "@/lib/formatters";
import TimeAgo from "./TimeAgo";
import LoadMoreFooter from "./LoadMoreFooter";

const PAGE_SIZE = 25;
/** Matches the seed the server component renders. */
const SEED_LIMIT = 10;

/**
 * Derive a human-readable action label from the trust limit.
 *
 * Stellar represents removing a trustline as setting its limit to 0.
 * Any positive value is either an initial set or an update.
 */
function trustAction(amount: string | null): string {
  if (!amount || amount === "0") return "Removed";
  return "Set";
}

/**
 * Split a Stellar asset string ("CODE:ISSUER") into its parts.
 * Native XLM arrives as "XLM" (no colon), so handle that gracefully.
 */
function parseAsset(asset: string | null): { code: string; issuer: string | null } {
  if (!asset) return { code: "Unknown", issuer: null };
  const colon = asset.indexOf(":");
  if (colon === -1) return { code: asset, issuer: null };
  return { code: asset.slice(0, colon), issuer: asset.slice(colon + 1) };
}

export default function AccountTrustlineTimeline({
  address,
  initial,
}: {
  address: string;
  initial: TrustlineOp[];
}) {
  const [rows, setRows] = useState(initial);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(initial.length >= SEED_LIMIT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keyed on the account address so stale pages from a previous address are
  // never applied, and any in-flight request is aborted on unmount/re-render.
  const scope = useAbortScope(address);

  const loadMore = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    const req = scope.next();
    try {
      const data = await gqlFetch(
        PUBLIC_GRAPHQL_URL,
        TRUSTLINE_QUERY,
        { address, limit: PAGE_SIZE, cursor },
        { signal: req.signal },
      );
      if (!req.isCurrent()) return;
      const page = data.operations;

      setRows((prev) => {
        const seen = new Set(prev.map((op) => op.id));
        return [...prev, ...page.items.filter((op) => !seen.has(op.id))];
      });
      setCursor(page.pageInfo.cursor);
      setHasNextPage(
        page.pageInfo.hasNextPage && page.pageInfo.cursor !== null,
      );
    } catch {
      if (!req.isCurrent()) return;
      setError("Could not load more trustline history.");
      setHasNextPage(false);
    } finally {
      setLoading(false);
    }
  }, [scope, address, cursor, loading]);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        No trustline changes recorded for this account.
      </p>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3 text-[13px] text-[var(--color-text-secondary)]">
        <span data-testid="trustline-count">
          {hasNextPage
            ? `Showing ${rows.length} of recent trustline changes`
            : `All ${rows.length} trustline change${rows.length === 1 ? "" : "s"}`}
        </span>
      </div>

      {/* Timeline — each row is one change_trust operation */}
      <ol className="relative border-l border-[var(--color-border-default)] ml-2">
        {rows.map((op) => {
          const { code, issuer } = parseAsset(op.asset);
          const action = trustAction(op.amount);
          const isRemoval = action === "Removed";

          return (
            <li key={op.id} className="mb-0 ml-5 last:mb-0">
              {/* Timeline dot */}
              <span
                className={[
                  "absolute -left-[9px] flex items-center justify-center w-[18px] h-[18px] rounded-full ring-2 ring-[var(--color-bg-default)]",
                  isRemoval
                    ? "bg-[var(--color-error-surface,#3f1f1f)]"
                    : "bg-[var(--color-accent-surface)]",
                ].join(" ")}
                aria-hidden="true"
              />

              <div className="py-3 pr-2">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  {/* Action badge */}
                  <span
                    className={[
                      "text-[10px] font-bold rounded-full px-2 py-0.5",
                      isRemoval
                        ? "bg-[var(--color-error-surface,#3f1f1f)] text-[var(--color-error-text)]"
                        : "bg-[var(--color-accent-surface)] text-[var(--color-accent-text)]",
                    ].join(" ")}
                  >
                    {action}
                  </span>

                  {/* Asset code */}
                  <span className="mono font-semibold text-sm text-[var(--color-text-primary)]">
                    {code}
                  </span>

                  {/* Issuer, truncated */}
                  {issuer && (
                    <span className="mono text-xs text-[var(--color-text-muted)]">
                      {truncateAddress(issuer, 6)}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                  {/* Trust limit — only meaningful when setting, not removing */}
                  {!isRemoval && op.amount && (
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      Limit:{" "}
                      <span className="mono">
                        {parseFloat(op.amount).toLocaleString()} {code}
                      </span>
                    </span>
                  )}

                  {/* Transaction link */}
                  <a
                    href={`https://stellar.expert/explorer/public/tx/${op.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mono text-xs text-[var(--color-accent-text)] hover:text-[var(--color-accent-text-hover)] hover:underline transition-colors"
                    aria-label={`View transaction ${op.transactionHash} on stellar.expert`}
                  >
                    {truncateAddress(op.transactionHash, 6)}
                  </a>

                  {/* Relative time */}
                  <span className="text-xs text-[var(--color-text-faint)]">
                    <TimeAgo isoString={op.createdAt} />
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <LoadMoreFooter
        loading={loading}
        error={error}
        hasMore={hasNextPage}
        endLabel="End of trustline history"
        onLoadMore={loadMore}
      />
    </>
  );
}
