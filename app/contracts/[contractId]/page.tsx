import type { Metadata } from "next";
import Link from "next/link";
import { GRAPHQL_URL, gqlFetch } from "@/lib/graphql";
import {
  getContractInterface,
  SHARED_WASM_LIMIT,
} from "@/lib/contractInterface";
import { routeMetadata } from "@/lib/metadata";
import { truncateAddress } from "@/lib/formatters";
import {
  parseStorageFilters,
  storageHref,
  STORAGE_DURABILITIES,
  type StorageFilters,
} from "@/lib/contractStorage";
import {
  ContractStorageEntriesDocument,
  type ContractStorageEntriesQuery,
} from "@/lib/generated/graphql";
import BackendUnavailable from "@/components/BackendUnavailable";
import CopyAddressButton from "@/components/CopyAddressButton";
import WatchIndicator from "@/components/WatchIndicator";
import SorobanValue from "@/components/SorobanValue";
import SharedWasmContracts from "@/components/SharedWasmContracts";
import ViewTracker from "@/components/ViewTracker";
import { ContractActions } from "@/components/ContractActions";

export const dynamic = "force-dynamic";

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

const CONTRACT_STORAGE_PAGE_SIZE = 25;

type StorageItem = ContractStorageEntriesQuery["contractStorageEntries"]["items"][number];

async function getContractStorage(
  contractId: string,
  filters: StorageFilters,
  cursor?: string,
): Promise<{
  items: StorageItem[];
  pageInfo: { hasNextPage: boolean; cursor: string | null };
  unavailable: boolean;
}> {
  try {
    const data = await gqlFetch(GRAPHQL_URL, ContractStorageEntriesDocument, {
      contractId,
      limit: CONTRACT_STORAGE_PAGE_SIZE,
      cursor: cursor ?? null,
      keyPrefix: filters.keyPrefix ?? null,
      durability: filters.durability ?? null,
    });
    return { ...data.contractStorageEntries, unavailable: false };
  } catch {
    return {
      items: [],
      pageInfo: { hasNextPage: false, cursor: null },
      unavailable: true,
    };
  }
}

const th =
  "text-start text-[11px] tracking-[0.06em] uppercase text-[var(--color-text-muted)] px-3 py-2.5 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]";
const stat =
  "bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] rounded-xl p-4";
const statLabel =
  "text-[11px] text-[var(--color-text-muted)] uppercase tracking-[0.05em]";
const filterLabel =
  "text-[11px] uppercase tracking-[0.05em] text-[var(--color-text-muted)]";
const filterControl =
  "rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] px-3 py-2 text-xs text-[var(--color-text-primary)]";

function signature(
  name: string,
  inputs: Array<{ name: string; type: string }>,
  outputs: string[],
) {
  const args = inputs.map((input) => `${input.name}: ${input.type}`).join(", ");
  return `${name}(${args})${outputs.length ? ` -> ${outputs.join(", ")}` : ""}`;
}

function singleParam(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function StorageValueCell({ entry }: { entry: StorageItem }) {
  if (entry.state === "ARCHIVED") {
    return (
      <span className="text-[var(--color-text-muted)]">
        Archived: the TTL expired. Restore the entry to read its value.
      </span>
    );
  }
  if (entry.value === null) {
    return <span className="text-[var(--color-text-muted)]">—</span>;
  }
  return (
    <SorobanValue
      value={entry.value}
      initialExpandedDepth={2}
      showRawToggle
      rawValue={entry.valueXdr ?? undefined}
    />
  );
}

export default async function ContractPage({
  params,
  searchParams,
}: {
  params: Promise<{ contractId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { contractId } = await params;
  const query = await searchParams;
  const filters = parseStorageFilters(query);
  const storageCursor = singleParam(query.storageCursor) || undefined;
  const filtersActive = Boolean(
    filters.keyPrefix || filters.durability || filters.invalidKeyPrefix,
  );

  const [storage, contractInterface] = await Promise.all([
    getContractStorage(contractId, filters, storageCursor),
    getContractInterface(GRAPHQL_URL, contractId),
  ]);

  const { deployment } = contractInterface;

  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12">
      <ViewTracker
        id={contractId}
        type="contract"
        label={truncateAddress(contractId, 6)}
        path={`/contracts/${contractId}`}
      />
      <Link
        href="/events"
        className="inline-block text-[13px] font-semibold text-[var(--color-accent-text)] hover:text-[var(--color-accent-text-hover)] mb-[18px]"
      >
        &larr; Back to Contract Events
      </Link>

      <div className="flex items-center gap-3 mb-1.5 flex-wrap">
        <h1 className="mono font-bold text-[22px] break-all text-[var(--color-text-primary)]">
          {contractId}
        </h1>
        <CopyAddressButton address={contractId} variant="hash" />
        <WatchIndicator address={contractId} />
        <ContractActions contract={contractInterface} contractId={contractId} />
      </div>
      <p className="text-[var(--color-text-muted)] text-[13px] mb-6">
        Soroban contract interface and storage
      </p>

      {/* Deployment details section (#379) */}
      <section className="mb-8" aria-labelledby="contract-deployment-heading">
        <h2
          id="contract-deployment-heading"
          className="font-extrabold text-base mb-3 text-[var(--color-text-primary)]"
        >
          Deployment
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={stat}>
            <div className={statLabel}>Deployer</div>
            {deployment?.deployer ? (
              <Link
                href={`/accounts/${deployment.deployer}`}
                className="mono text-xs text-[var(--color-accent-text)] hover:text-[var(--color-accent-text-hover)] hover:underline break-all mt-1 block"
              >
                {truncateAddress(deployment.deployer, 6)}
              </Link>
            ) : (
              <div className="text-xs text-[var(--color-text-muted)] mt-1">
                {deployment === null ? "Unavailable" : "Not recorded yet"}
              </div>
            )}
          </div>
          <div className={stat}>
            <div className={statLabel}>Deployment Ledger</div>
            {deployment?.deploymentLedger != null ? (
              <Link
                href={`/ledgers/${deployment.deploymentLedger}`}
                className="mono text-xs text-[var(--color-accent-text)] hover:text-[var(--color-accent-text-hover)] hover:underline mt-1 block"
              >
                {deployment.deploymentLedger.toLocaleString()}
              </Link>
            ) : (
              <div className="text-xs text-[var(--color-text-muted)] mt-1">
                {deployment === null ? "Unavailable" : "Not recorded yet"}
              </div>
            )}
          </div>
          <div className={stat}>
            <div className={statLabel}>WASM Hash</div>
            {contractInterface.wasmHash ? (
              <span className="mono text-xs text-[var(--color-text-secondary)] break-all mt-1 block">
                {truncateAddress(contractInterface.wasmHash, 8)}
              </span>
            ) : (
              <div className="text-xs text-[var(--color-text-muted)] mt-1">Not recorded yet</div>
            )}
          </div>
        </div>

        {/* Only once the deployment loaded: an unavailable API must not read
            as "no other contract shares this code". */}
        {deployment && (
          <SharedWasmContracts
            contracts={deployment.sharedWasmContracts}
            limit={SHARED_WASM_LIMIT}
          />
        )}
      </section>

      <section className="mb-8" aria-labelledby="contract-interface-heading">
        <div className="flex items-baseline justify-between gap-4 mb-3 flex-wrap">
          <h2
            id="contract-interface-heading"
            className="font-extrabold text-base text-[var(--color-text-primary)]"
          >
            Contract Interface
          </h2>
          {contractInterface.wasmHash && (
            <span className="mono text-xs text-[var(--color-text-muted)] break-all">
              WASM {contractInterface.wasmHash}
            </span>
          )}
        </div>

        {contractInterface.functions.length > 0 ? (
          <ul className="rounded-xl border border-[var(--color-border-default)] divide-y divide-[var(--color-border-default)]">
            {contractInterface.functions.map((fn) => (
              <li
                key={signature(fn.name, fn.inputs, fn.outputs)}
                className="p-4"
              >
                <code className="mono text-sm text-[var(--color-text-primary)] break-words">
                  {signature(fn.name, fn.inputs, fn.outputs)}
                </code>
              </li>
            ))}
          </ul>
        ) : (
          <div
            role="status"
            className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] p-5 text-sm text-[var(--color-text-muted)]"
          >
            {contractInterface.unavailable
              ? "The contract interface service is temporarily unavailable."
              : contractInterface.unreadable
                ? "This contract's WASM specification could not be read."
                : "No readable function specification is indexed for this contract yet."}
          </div>
        )}
      </section>

      <section aria-labelledby="storage-heading" className="mb-8">
        <h2
          id="storage-heading"
          className="font-extrabold text-base mb-3 text-[var(--color-text-primary)]"
        >
          Storage Entries
        </h2>

        {storage.unavailable ? (
          <BackendUnavailable />
        ) : (
          <>
            <form
              method="get"
              action={`/contracts/${encodeURIComponent(contractId)}`}
              aria-label="Filter storage entries"
              className="flex flex-wrap items-end gap-3 mb-4"
            >
              <div className="flex flex-col gap-1 flex-1 min-w-[14rem]">
                <label htmlFor="storage-key-prefix" className={filterLabel}>
                  Key prefix (base64 XDR)
                </label>
                <input
                  id="storage-key-prefix"
                  name="keyPrefix"
                  type="text"
                  defaultValue={singleParam(query.keyPrefix)}
                  autoComplete="off"
                  spellCheck={false}
                  className={`mono ${filterControl}`}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="storage-durability" className={filterLabel}>
                  Durability
                </label>
                <select
                  id="storage-durability"
                  name="durability"
                  defaultValue={filters.durability ?? ""}
                  className={filterControl}
                >
                  <option value="">Any</option>
                  {STORAGE_DURABILITIES.map((durability) => (
                    <option key={durability} value={durability}>
                      {durability === "PERSISTENT" ? "Persistent" : "Temporary"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="rounded-lg bg-[var(--color-accent-fill)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  Apply filters
                </button>
                {filtersActive && (
                  <Link
                    href={storageHref(contractId, {})}
                    className="text-sm font-medium text-[var(--color-accent-text)] hover:underline"
                  >
                    Clear
                  </Link>
                )}
              </div>
            </form>

            {filters.invalidKeyPrefix && (
              <p role="status" className="text-xs text-[var(--color-text-secondary)] mb-4">
                The key prefix must be base64 XDR (letters, digits, + and /, with
                optional trailing =). It was not applied, so every entry is shown.
              </p>
            )}

            {storage.items.length === 0 ? (
              <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] p-8 text-center">
                <p className="text-sm text-[var(--color-text-muted)]">
                  {filtersActive
                    ? "No storage entries match these filters."
                    : "No storage entries indexed for this contract yet. Event indexing is opt-in on the indexer — see the lumina-backend README."}
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-[var(--color-border-default)] overflow-x-auto mb-4">
                  <table className="w-full text-sm border-collapse">
                    <caption className="sr-only">Contract storage entries</caption>
                    <thead>
                      <tr>
                        <th scope="col" className={th}>Key</th>
                        <th scope="col" className={th}>Durability</th>
                        <th scope="col" className={th}>State</th>
                        <th scope="col" className={th}>Value</th>
                        <th scope="col" className={th}>Last Modified</th>
                        <th scope="col" className={th}>Live Until</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storage.items.map((entry) => (
                        <tr
                          key={entry.key}
                          className="border-b border-[var(--color-bg-overlay)] last:border-0"
                        >
                          <td className="py-2.5 px-3 mono text-xs text-[var(--color-text-primary)] break-all">
                            {entry.key}
                          </td>
                          <td className="py-2.5 px-3 text-xs text-[var(--color-text-secondary)] font-semibold">
                            {entry.durability === "PERSISTENT" ? "Persistent" : "Temporary"}
                          </td>
                          <td className="py-2.5 px-3 text-xs text-[var(--color-text-secondary)]">
                            {entry.state === "ARCHIVED" ? "Archived" : "Active"}
                          </td>
                          <td className="py-2.5 px-3 text-xs">
                            <StorageValueCell entry={entry} />
                          </td>
                          <td className="py-2.5 px-3 mono text-xs text-[var(--color-text-secondary)]">
                            {entry.lastModifiedLedger.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 mono text-xs text-[var(--color-text-muted)]">
                            {entry.liveUntilLedger == null
                              ? "—"
                              : entry.liveUntilLedger.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end gap-3">
                  {storageCursor && (
                    <Link
                      href={storageHref(contractId, filters)}
                      className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border-default)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-raised)] transition-colors"
                    >
                      ← First page
                    </Link>
                  )}
                  {storage.pageInfo.hasNextPage && storage.pageInfo.cursor && (
                    <Link
                      href={storageHref(contractId, filters, storage.pageInfo.cursor)}
                      className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-accent-fill)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                    >
                      Next →
                    </Link>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
