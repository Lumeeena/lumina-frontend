import type { Metadata } from "next";
import { ContractEventsDocument as EVENTS_QUERY } from "@/lib/generated/graphql";
import { gqlFetch, GRAPHQL_URL } from "@/lib/graphql";
import { ContractEventsDocument as EVENTS_QUERY } from "@/lib/generated/graphql";
import { routeMetadata } from "@/lib/metadata";
import { EVENTS } from "@/lib/routes";
import type { ContractEvent } from "@/lib/types";
import {
  ContractEventsDocument,
  type ContractEventsQuery,
  type ContractEventsQueryVariables,
} from "@/lib/generated/graphql";
import { truncateAddress } from "@/lib/formatters";
import TimeAgo from "@/components/TimeAgo";
import BackendUnavailable from "@/components/BackendUnavailable";

export const dynamic = "force-dynamic";

// The `?contractId=` in the URL picks which contract's events to show. It is
// deliberately not in the canonical URL: `/events?contractId=C…` is a filtered
// view of the same page, and listing it beside `/events` would have two URLs
// competing for the same content.
export const metadata: Metadata = routeMetadata(EVENTS);

// The Lumina Registry deployed on testnet — the only contract with any
// registered activity right now, used as the default example here.
const DEFAULT_CONTRACT_ID =
  "CAYUDQPV3RKPM3EXDFGI3457FV677JLUCJ4OLKWGCUBPRIHYKXK3WFAZ";

async function getEvents(contractId: string, cursor?: string): Promise<{
  events: ContractEvent[];
  pageInfo: { hasNextPage: boolean; cursor: string | null } | null;
  unavailable: boolean;
}> {
  try {
    const data = await gqlFetch(GRAPHQL_URL, EVENTS_QUERY, { contractId, limit: 20 });
    return { events: data.events.items, unavailable: false };
  } catch {
    return { events: [], pageInfo: null, unavailable: true };
  }
}

const th =
  "text-left text-[11px] tracking-[0.06em] uppercase text-[var(--color-text-muted)] px-3 py-2.5 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ contractId?: string; cursor?: string }>;
}) {
  const { contractId: rawContractId, cursor } = await searchParams;
  const contractId = rawContractId?.trim() || DEFAULT_CONTRACT_ID;
  const result = await getEvents(contractId, cursor);
  const nextHref = result.pageInfo?.hasNextPage && result.pageInfo.cursor
    ? `/events?${new URLSearchParams({ contractId, cursor: result.pageInfo.cursor })}`
    : null;

  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12">
      <h1 className="font-extrabold text-3xl mb-2 text-[var(--color-text-primary)]">
        Contract Events
      </h1>
      <p className="text-[var(--color-text-secondary)] mb-7">
        Soroban contract events indexed via RPC, newest first.
      </p>

      <form action="/events" method="get" className="flex gap-2.5 mb-7">
        <input
          name="contractId"
          defaultValue={contractId}
          placeholder="Contract ID (C...)"
          className="flex-1 min-h-[46px] px-3.5 py-2.5 text-[13px] mono bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] rounded-[9px]"
        />
        <button
          type="submit"
          className="bg-[var(--color-accent-9)] hover:bg-[var(--color-accent-10)] text-white font-bold text-sm px-6 rounded-[9px] transition-colors"
        >
          Filter
        </button>
      </form>

      <div className="rounded-xl border border-[var(--color-border-default)] overflow-x-auto">
        {result.unavailable ? (
          <BackendUnavailable />
        ) : result.events.length === 0 ? (
          <div className="p-8 text-center text-[var(--color-text-muted)] text-sm">
            No events indexed for this contract yet. Event indexing is opt-in on
            the indexer (<span className="mono">INDEXED_CONTRACT_IDS</span>/
            <span className="mono">REGISTRY_CONTRACT_ID</span>) — see the
            lumina-backend README.
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className={th}>Contract</th>
                <th className={th}>Topic</th>
                <th className={th}>Value</th>
                <th className={th}>Ledger</th>
                <th className={th}>Time</th>
              </tr>
            </thead>
            <tbody>
              {result.events.map((ev) => (
                <tr
                  key={ev.id}
                  className="border-b border-[var(--color-bg-overlay)] last:border-0"
                >
                  <td className="py-2.5 px-3 mono text-xs text-[var(--color-accent-11)]">
                    {truncateAddress(ev.contractId, 6)}
                  </td>
                  <td className="py-2.5 px-3">
                    {ev.topics[0] && (
                      <span className="text-[11px] font-semibold bg-[var(--color-accent-3)] text-[var(--color-accent-11)] rounded-md px-2 py-[3px]">
                        {ev.topics[0]}
                        {ev.topics.length > 1
                          ? ` +${ev.topics.length - 1}`
                          : ""}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 max-w-[360px] align-top">
                    {ev.value == null ? "—" : <SorobanValue value={ev.value} />}
                  </td>
                  <td className="py-2.5 px-3 mono text-xs text-[var(--color-text-secondary)]">
                    {ev.ledger.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-xs text-[var(--color-text-muted)]">
                    <TimeAgo isoString={ev.createdAt} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
