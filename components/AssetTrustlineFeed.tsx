import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { truncateAddress } from "@/lib/formatters";
import { withNetwork, type NetworkId } from "@/lib/network";

/** One `change_trust` operation on an asset: an account opening, moving or closing a trustline. */
export interface AssetTrustlineChange {
  id: string;
  createdAt: string;
  transactionHash: string;
  sourceAccount: string;
  /** The trustline limit after the change, as a decimal string. Null when the schema has none. */
  amount: string | null;
}

export interface AssetTrustlineFeedProps {
  /** How the asset is named in the copy, e.g. `USDC`. */
  assetLabel: string;
  items: AssetTrustlineChange[];
  /** The read failed. Shown as its own state, never as "no changes". */
  unavailable: boolean;
  /** Transaction links keep the network the asset page was read on. */
  network: NetworkId;
}

/**
 * Who opened, changed or closed a trustline to this asset, newest first.
 *
 * A server component with no state: the asset page fetches the rows and this
 * only lays them out. The date is the ISO day rather than a locale string, so
 * the server render and the browser agree without a hydration pass.
 *
 * An unavailable read says so. Rendering it as an empty list would tell a reader
 * the asset has never had a trustline, which is a claim the page cannot back up.
 */
export default function AssetTrustlineFeed({
  assetLabel,
  items,
  unavailable,
  network,
}: AssetTrustlineFeedProps) {
  return (
    <section aria-labelledby="asset-trustlines-heading" className="mb-8">
      <h2
        id="asset-trustlines-heading"
        className="font-extrabold text-base mb-3 text-[var(--color-text-primary)]"
      >
        Trustline changes
      </h2>

      {unavailable ? (
        <p role="status" className="text-[13px] text-[var(--color-text-muted)]">
          Trustline changes for {assetLabel} could not be loaded right now.
        </p>
      ) : items.length === 0 ? (
        <EmptyState
          variant="inline"
          title={`No trustline changes indexed for ${assetLabel} yet.`}
        />
      ) : (
        <div
          role="region"
          aria-labelledby="asset-trustlines-heading"
          tabIndex={0}
          className="rounded-xl border border-[var(--color-border-default)] overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-fill)]"
        >
          <table className="w-full min-w-[480px] text-sm border-collapse">
            <caption className="sr-only">
              Trustline changes for {assetLabel}, newest first
            </caption>
            <thead>
              <tr>
                <th
                  scope="col"
                  className="text-start text-[11px] tracking-[0.06em] uppercase text-[var(--color-text-muted)] px-3 py-2.5 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="text-start text-[11px] tracking-[0.06em] uppercase text-[var(--color-text-muted)] px-3 py-2.5 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]"
                >
                  Account
                </th>
                <th
                  scope="col"
                  className="text-end text-[11px] tracking-[0.06em] uppercase text-[var(--color-text-muted)] px-3 py-2.5 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]"
                >
                  Limit
                </th>
                <th
                  scope="col"
                  className="text-start text-[11px] tracking-[0.06em] uppercase text-[var(--color-text-muted)] px-3 py-2.5 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]"
                >
                  Transaction
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-[var(--color-border-default)] last:border-0"
                >
                  <td className="py-2.5 px-3 mono text-xs text-[var(--color-text-secondary)]">
                    {item.createdAt.slice(0, 10)}
                  </td>
                  <td
                    className="py-2.5 px-3 mono text-xs text-[var(--color-text-primary)]"
                    title={item.sourceAccount}
                  >
                    {truncateAddress(item.sourceAccount, 8)}
                  </td>
                  <td className="py-2.5 px-3 mono text-xs text-[var(--color-text-secondary)] text-end">
                    {item.amount ?? "—"}
                  </td>
                  <td className="py-2.5 px-3 mono text-xs">
                    <Link
                      href={withNetwork(
                        `/transactions/${encodeURIComponent(item.transactionHash)}`,
                        network,
                      )}
                      className="text-[var(--color-accent-text)] hover:text-[var(--color-accent-text-hover)] hover:underline"
                    >
                      {truncateAddress(item.transactionHash, 8)}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
