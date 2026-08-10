import { gqlFetch, GRAPHQL_URL } from "@/lib/graphql";
import type { ContractEvent } from "@/lib/types";
import { timeAgo, truncateAddress } from "@/lib/formatters";

export const dynamic = 'force-dynamic';

// The Lumina Registry deployed on testnet — the only contract with any
// registered activity right now, used as the default example here.
const DEFAULT_CONTRACT_ID = "CAYUDQPV3RKPM3EXDFGI3457FV677JLUCJ4OLKWGCUBPRIHYKXK3WFAZ";

const EVENTS_QUERY = `
  query ContractEvents($contractId: String!, $limit: Int) {
    events(contractId: $contractId, limit: $limit) {
      items {
        id
        type
        contractId
        ledger
        createdAt
        topics
        value
      }
    }
  }
`;

async function getEvents(contractId: string): Promise<ContractEvent[]> {
  try {
    const data = await gqlFetch<{ events: { items: ContractEvent[] } }>(GRAPHQL_URL, EVENTS_QUERY, { contractId, limit: 20 });
    return data.events.items;
  } catch {
    return [];
  }
}

const th = "text-left text-[11px] tracking-[0.06em] uppercase text-[#a6a3b0] px-3 py-2.5 border-b border-[#e5e3ea] bg-[#fafafa]";

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ contractId?: string }> }) {
  const { contractId: rawContractId } = await searchParams;
  const contractId = rawContractId?.trim() || DEFAULT_CONTRACT_ID;
  const events = await getEvents(contractId);

  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12">
      <h1 className="font-extrabold text-3xl mb-2 text-[#0e0e12]">Contract Events</h1>
      <p className="text-[#6b6975] mb-7">Soroban contract events indexed via RPC, newest first.</p>

      <form action="/events" method="get" className="flex gap-2.5 mb-7">
        <input
          name="contractId"
          defaultValue={contractId}
          placeholder="Contract ID (C...)"
          className="flex-1 min-h-[46px] px-3.5 py-2.5 text-[13px] mono bg-[#fafafa] border border-[#e5e3ea] rounded-[9px]"
        />
        <button type="submit" className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-bold text-sm px-6 rounded-[9px] transition-colors">
          Filter
        </button>
      </form>

      <div className="rounded-xl border border-[#e5e3ea] overflow-x-auto">
        {events.length === 0 ? (
          <div className="p-8 text-center text-[#a6a3b0] text-sm">
            No events indexed for this contract yet. Event indexing is opt-in on the indexer (<span className="mono">INDEXED_CONTRACT_IDS</span>/<span className="mono">REGISTRY_CONTRACT_ID</span>) — see the lumina-backend README.
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
              {events.map(ev => (
                <tr key={ev.id} className="border-b border-[#f0eff3] last:border-0">
                  <td className="py-2.5 px-3 mono text-xs text-[#7c3aed]">{truncateAddress(ev.contractId, 6)}</td>
                  <td className="py-2.5 px-3">
                    {ev.topics[0] && (
                      <span className="text-[11px] font-semibold bg-[#f3effe] text-[#6d28d9] rounded-md px-2 py-[3px]">
                        {ev.topics[0]}{ev.topics.length > 1 ? ` +${ev.topics.length - 1}` : ""}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 mono text-xs text-[#6b6975] max-w-[280px] truncate">{ev.value ?? "—"}</td>
                  <td className="py-2.5 px-3 mono text-xs text-[#6b6975]">{ev.ledger.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-xs text-[#c3c1cb]">{timeAgo(ev.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
