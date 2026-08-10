import { gqlFetch, GRAPHQL_URL } from "@/lib/graphql";
import type { Ledger, Operation } from "@/lib/types";
import { getActiveContracts } from "@/lib/registry";
import { formatOperationType } from "@/lib/formatters";
import StatCard from "@/components/StatCard";

export const dynamic = 'force-dynamic';

const STATS_QUERY = `
  query Stats($opLimit: Int) {
    latestLedger {
      sequence
      transactionCount
    }
    operations(limit: $opLimit) {
      items { type }
    }
  }
`;

async function getStats() {
  try {
    return await gqlFetch<{ latestLedger: Ledger | null; operations: { items: Operation[] } }>(GRAPHQL_URL, STATS_QUERY, { opLimit: 200 });
  } catch {
    return { latestLedger: null, operations: { items: [] } };
  }
}

async function getContractsRegisteredCount(): Promise<number | null> {
  try {
    const entries = await getActiveContracts();
    return entries.length;
  } catch {
    return null;
  }
}

function opBreakdown(operations: Operation[]) {
  const counts = new Map<string, number>();
  for (const op of operations) counts.set(op.type, (counts.get(op.type) ?? 0) + 1);
  const total = operations.length;
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({
      label: formatOperationType(type.toLowerCase()),
      pct: total ? Math.round((count / total) * 100) : 0,
    }));
}

export default async function StatsPage() {
  const [{ latestLedger, operations }, contractsRegistered] = await Promise.all([
    getStats(),
    getContractsRegisteredCount(),
  ]);
  const breakdown = opBreakdown(operations.items);

  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12">
      <h1 className="font-extrabold text-3xl mb-2 text-[#0e0e12]">Network Stats</h1>
      <p className="text-[#6b6975] mb-8">Indexer health and Stellar network throughput at a glance.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-9">
        <StatCard title="Latest Ledger" value={latestLedger ? latestLedger.sequence.toLocaleString() : "—"} subtitle="Stellar Mainnet" />
        <StatCard title="Txs (last ledger)" value={latestLedger ? latestLedger.transactionCount.toLocaleString() : "—"} subtitle="Successful + failed" />
        <StatCard title="Contracts Registered" value={contractsRegistered ?? "—"} subtitle="Via Lumina Registry" />
        <StatCard title="Avg Ledger Time" value="~5s" subtitle="Protocol target, not a live average" />
      </div>

      <h2 className="font-extrabold text-base mb-3.5 text-[#0e0e12]">Operation Type Breakdown</h2>
      <p className="text-xs text-[#a6a3b0] mb-3">Based on the most recent {operations.items.length} indexed operations.</p>
      <div className="border border-[#e5e3ea] rounded-xl p-5 flex flex-col gap-3.5">
        {breakdown.length === 0 ? (
          <p className="text-sm text-[#a6a3b0]">No operations indexed yet.</p>
        ) : (
          breakdown.map(op => (
            <div key={op.label}>
              <div className="flex justify-between text-[13px] mb-1.5">
                <span className="font-semibold text-[#0e0e12]">{op.label}</span>
                <span className="mono text-[#a6a3b0]">{op.pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#f0eff3] overflow-hidden">
                <div className="h-full rounded-full bg-[#8b5cf6]" style={{ width: `${op.pct}%` }} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
