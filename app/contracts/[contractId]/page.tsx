import type { Metadata } from "next";
import Link from "next/link";
import { GRAPHQL_URL, gqlFetch } from "@/lib/graphql";
import { getContractInterface } from "@/lib/contractInterface";
import { routeMetadata } from "@/lib/metadata";
import { truncateAddress } from "@/lib/formatters";
import {
  ContractStorageEntriesDocument,
  type ContractStorageEntriesQuery,
} from "@/lib/generated/graphql";
import BackendUnavailable from "@/components/BackendUnavailable";
import CopyAddressButton from "@/components/CopyAddressButton";
import WatchIndicator from "@/components/WatchIndicator";
import SorobanValue from "@/components/SorobanValue";
import ViewTracker from "@/components/ViewTracker";

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

function signature(
  name: string,
  inputs: Array<{ name: string; type: string }>,
  outputs: string[],
) {
  const args = inputs.map((input) => `${input.name}: ${input.type}`).join(", ");
  return `${name}(${args})${outputs.length ? ` -> ${outputs.join(", ")}` : ""}`;
}

export default async function ContractPage({
  params,
  searchParams,
}: {
  params: Promise<{ contractId: string }>;
  searchParams: Promise<{ storageCursor?: string }>;
}) {
  const { contractId } = await params;
  const { storageCursor } = await searchParams;

  const [storage, contractInterface] = await Promise.all([
    getContractStorage(contractId, storageCursor),
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

        {contractInterface.sharedContractIds.length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">
              Contracts using the same WASM
            </h3>
            <ul className="space-y-1">
              {contractInterface.sharedContractIds.map((sharedId) => (
                <li key={sharedId}>
                  <Link
                    href={`/contracts/${sharedId}`}
                    className="mono text-xs text-[var(--color-accent-text)] hover:text-[var(--color-accent-text-hover)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-fill)]"
                  >
                    {sharedId}
                  </Link>
                </li>
              ))}
            </ul>
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
        ) : storage.items.length === 0 ? (
          <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] p-8 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">
              No storage entries indexed for this contract yet. Event indexing
              is opt-in on the indexer — see the lumina-backend README.
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
                    <th scope="col" className={th}>Value</th>
                    <th scope="col" className={th}>Last Modified</th>
                    <th scope="col" className={th}>Expiration</th>
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
                      <td className="py-2.5 px-3 mono text-xs text-[var(--color-text-muted)]">
                        {entry.expiration.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-3">
              {storageCursor && (
                <Link
                  href={`/contracts/${contractId}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border-default)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-raised)] transition-colors"
                >
                  ← First page
                </Link>
              )}
              {storage.pageInfo.hasNextPage && storage.pageInfo.cursor && (
                <Link
                  href={`/contracts/${contractId}?storageCursor=${encodeURIComponent(storage.pageInfo.cursor)}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-accent-fill)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  Next →
                </Link>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
