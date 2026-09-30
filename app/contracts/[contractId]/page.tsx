import type { Metadata } from "next";
import Link from "next/link";
import { gqlFetch, GRAPHQL_URL } from "@/lib/graphql";
import { routeMetadata } from "@/lib/metadata";
import { truncateAddress } from "@/lib/formatters";
import BackendUnavailable from "@/components/BackendUnavailable";
import CopyAddressButton from "@/components/CopyAddressButton";
import WatchIndicator from "@/components/WatchIndicator";
import SorobanValue from "@/components/SorobanValue";
import TimeAgo from "@/components/TimeAgo";

export const dynamic = "force-dynamic";

/**
 * Metadata from the contract ID alone, following the same pattern as
 * transaction and account pages: a share card is fetched by bots that do not
 * wait for GraphQL, and a title built from the URL is instant and always
 * correct.
 */
export function generateMetadata({
  params,
}: {
  params: Promise<{ contractId: string }>;
}): Promise<Metadata> {
  return params.then(({ contractId }) => {
    const short = truncateAddress(contractId, 6);
    return routeMetadata({
      label: `Contract ${short}`,
      description: `Soroban contract ${contractId}: storage entries and history, indexed on Lumina.`,
      path: `/contracts/${contractId}`,
    });
  });
}

interface ContractStorageEntry {
  key: string;
  durability: string;
  value: unknown;
  lastModifiedLedger: number;
  expiration?: number;
}

interface StorageResult {
  entries: ContractStorageEntry[];
  unavailable: boolean;
  noStorageQuery: boolean;
}

/**
 * Fetch contract storage entries. Currently returns a placeholder since the
 * backend query is not yet available. Once contractStorageEntries is added to
 * the backend, this function will fetch real data.
 */
async function getContractStorage(): Promise<StorageResult> {
  return {
    entries: [],
    unavailable: false,
    noStorageQuery: true,
  };
}

const th =
  "text-start text-[11px] tracking-[0.06em] uppercase text-[var(--color-text-muted)] px-3 py-2.5 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]";
const stat =
  "bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] rounded-xl p-4";
const statLabel =
  "text-[11px] text-[var(--color-text-muted)] uppercase tracking-[0.05em]";

export default async function ContractPage({
  params,
}: {
  params: Promise<{ contractId: string }>;
}) {
  const { contractId } = await params;
  const { entries, unavailable, noStorageQuery } = await getContractStorage();

  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12">
      <Link
        href="/events"
        className="inline-block text-[13px] font-semibold text-[var(--color-accent-text)] hover:text-[var(--color-accent-text-hover)] mb-[18px]"
      >
        &larr; Back to Contract Events
      </Link>

      {unavailable ? (
        <BackendUnavailable />
      ) : noStorageQuery ? (
        <div className="p-8 rounded-xl border border-[var(--color-warning-outline)] bg-[var(--color-warning-bg)]">
          <p className="text-[var(--color-warning-text)] font-semibold mb-2">
            Storage Inspection Coming Soon
          </p>
          <p className="text-[var(--color-text-muted)] text-sm max-w-2xl">
            The backend is not yet indexing contract storage entries. This page
            will show a paginated list of all storage keys for this contract,
            with their durability, value, and modification history once the
            backend is updated.
          </p>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
            <h1 className="mono font-bold text-[22px] break-all text-[var(--color-text-primary)]">
              {contractId}
            </h1>
            <CopyAddressButton address={contractId} variant="hash" />
            <WatchIndicator address={contractId} />
          </div>
          <p className="text-[var(--color-text-muted)] text-[13px] mb-6">
            Soroban contract storage
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <div className={stat}>
              <div className={statLabel}>Total Entries</div>
              <div className="font-bold text-sm mt-1 text-[var(--color-text-primary)]">
                {entries.length}
              </div>
            </div>
          </div>

          <h2 className="font-extrabold text-base mb-3 text-[var(--color-text-primary)]">
            Storage Entries
          </h2>
          <div className="rounded-xl border border-[var(--color-border-default)] overflow-x-auto">
            {entries.length === 0 ? (
              <div className="p-8 text-center text-[var(--color-text-muted)] text-sm">
                No storage entries indexed for this contract yet. Event indexing
                is opt-in on the indexer — see the lumina-backend README.
              </div>
            ) : (
              <table className="w-full text-sm border-collapse">
                <caption className="sr-only">Contract storage entries</caption>
                <thead>
                  <tr>
                    <th scope="col" className={th}>
                      Key
                    </th>
                    <th scope="col" className={th}>
                      Durability
                    </th>
                    <th scope="col" className={th}>
                      Value
                    </th>
                    <th scope="col" className={th}>
                      Last Modified
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr
                      key={entry.key}
                      className="border-b border-[var(--color-bg-overlay)] last:border-0"
                    >
                      <td className="py-2.5 px-3 mono text-xs text-[var(--color-text-primary)] break-all">
                        {entry.key}
                      </td>
                      <td className="py-2.5 px-3 text-xs text-[var(--color-text-secondary)] font-semibold">
                        {entry.durability}
                      </td>
                      <td className="py-2.5 px-3 text-xs">
                        <SorobanValue
                          value={entry.value}
                          initialExpandedDepth={2}
                          showRawToggle
                          rawValue={entry.value}
                        />
                      </td>
                      <td className="py-2.5 px-3 mono text-xs text-[var(--color-text-secondary)]">
                        {entry.lastModifiedLedger.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
