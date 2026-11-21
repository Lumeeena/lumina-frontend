import Link from "next/link";
import TimeAgo from "./TimeAgo";
import { truncateAddress } from "@/lib/formatters";

export interface AccountLifecycleData {
  createdAt: string | null;
  creatorAddress: string | null;
  startingBalance: string | null;
  creationTransactionHash: string | null;
  mergedAt: string | null;
  mergedIntoAddress: string | null;
  mergeTransactionHash: string | null;
}

interface AccountLifecycleProps {
  lifecycle: AccountLifecycleData;
}

const label = "text-[11px] text-[var(--color-text-muted)] uppercase tracking-[0.05em]";
const value = "mono text-sm mt-0.5 text-[var(--color-text-primary)] break-all";

/**
 * Shows the indexed creation and merge events for an account.
 * Handles accounts that have been merged away.
 */
export default function AccountLifecycle({ lifecycle }: AccountLifecycleProps) {
  const isMerged = !!lifecycle.mergedIntoAddress;

  return (
    <section aria-labelledby="lifecycle-heading" className="mb-9">
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <h2
          id="lifecycle-heading"
          className="font-extrabold text-base text-[var(--color-text-primary)]"
        >
          Account Lifecycle
        </h2>
        {isMerged && (
          <span className="rounded-full bg-[var(--color-warning-bg)] border border-[var(--color-warning-outline)] text-[var(--color-warning-text)] text-xs font-semibold px-3 py-1">
            Merged
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
            Creation
          </p>
          {lifecycle.createdAt ? (
            <>
              <div>
                <div className={label}>Time</div>
                <div className={value}>
                  <TimeAgo isoString={lifecycle.createdAt} />
                </div>
              </div>
              {lifecycle.creatorAddress && (
                <div>
                  <div className={label}>Funded by</div>
                  <div className={value}>
                    <Link
                      href={`/accounts/${lifecycle.creatorAddress}`}
                      className="text-[var(--color-accent-text)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-fill)]"
                    >
                      {truncateAddress(lifecycle.creatorAddress, 8)}
                    </Link>
                  </div>
                </div>
              )}
              {lifecycle.startingBalance && (
                <div>
                  <div className={label}>Starting balance</div>
                  <div className={value}>{lifecycle.startingBalance} XLM</div>
                </div>
              )}
              {lifecycle.creationTransactionHash && (
                <div>
                  <div className={label}>Transaction</div>
                  <div className={value}>
                    <Link
                      href={`/transactions/${lifecycle.creationTransactionHash}`}
                      className="text-[var(--color-accent-text)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-fill)]"
                    >
                      {truncateAddress(lifecycle.creationTransactionHash, 8)}
                    </Link>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">
              Creation not indexed. The account may have been created before
              this deployment started indexing.
            </p>
          )}
        </div>

        <div className="bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
            Merge
          </p>
          {isMerged ? (
            <>
              {lifecycle.mergedAt && (
                <div>
                  <div className={label}>Time</div>
                  <div className={value}>
                    <TimeAgo isoString={lifecycle.mergedAt} />
                  </div>
                </div>
              )}
              <div>
                <div className={label}>Merged into</div>
                <div className={value}>
                  <Link
                    href={`/accounts/${lifecycle.mergedIntoAddress}`}
                    className="text-[var(--color-accent-text)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-fill)]"
                  >
                    {truncateAddress(lifecycle.mergedIntoAddress!, 8)}
                  </Link>
                </div>
              </div>
              {lifecycle.mergeTransactionHash && (
                <div>
                  <div className={label}>Transaction</div>
                  <div className={value}>
                    <Link
                      href={`/transactions/${lifecycle.mergeTransactionHash}`}
                      className="text-[var(--color-accent-text)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-fill)]"
                    >
                      {truncateAddress(lifecycle.mergeTransactionHash, 8)}
                    </Link>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">
              This account has not been merged.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
