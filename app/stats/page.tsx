import { gqlFetch, GRAPHQL_URL } from "@/lib/graphql";
import { StatsDocument } from "@/lib/generated/graphql";
import { routeMetadata } from "@/lib/metadata";
import { STATS } from "@/lib/routes";
import type { Operation } from "@/lib/types";
import { getActiveContracts } from "@/lib/registry";
import { formatOperationType } from "@/lib/formatters";
import StatCard from "@/components/StatCard";
import BackendUnavailable from "@/components/BackendUnavailable";

export const metadata: Metadata = routeMetadata(STATS);

async function getStats() {
  try {
    const data = await gqlFetch(GRAPHQL_URL, StatsDocument, { opLimit: 200 });
    return { ...data, unavailable: false };
  } catch {
    return { latestLedger: null, operations: { items: [] }, unavailable: true };
  }
}

async function getContractsRegisteredCount(): Promise<{ count: number | null; unavailable: boolean }> {
  try {
    const entries = await getActiveContracts();
    return { count: entries.length, unavailable: false };
  } catch {
    return { count: null, unavailable: true };
  }
}

function opBreakdown(operations: Pick<Operation, "type">[]) {
  const counts = new Map<string, number>();
  for (const op of operations)
    counts.set(op.type, (counts.get(op.type) ?? 0) + 1);
  const total = operations.length;
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({
      label: formatOperationType(type.toLowerCase()),
      pct: total ? Math.round((count / total) * 100) : 0,
    }));
}

export default async function StatsPage() {
  const [{ latestLedger, operations, unavailable }, contracts] = await Promise.all([
    getStats(),
    getContractsRegisteredCount(),
  ]);
  // A 200 can still come back half-empty — GraphQL nulls a field whose resolver
  // failed rather than failing the whole query. The ledger and the breakdown
  // are independent, so a missing one is an empty breakdown, not a thrown
  // `not iterable` that takes the page down with it.
  const indexed = operations?.items ?? [];
  const breakdown = opBreakdown(indexed);

  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12">
      <h1 className="font-extrabold text-3xl mb-2 text-[var(--color-text-primary)]">Network Stats</h1>
      <p className="text-[var(--color-text-secondary)] mb-8">Indexer health and Stellar network throughput at a glance.</p>
      {unavailable && <BackendUnavailable />}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-9">
        <StatCard title="Latest Ledger" value={latestLedger ? latestLedger.sequence.toLocaleString() : "—"} subtitle="Stellar Mainnet" />
        <StatCard title="Txs (last ledger)" value={latestLedger ? latestLedger.transactionCount.toLocaleString() : "—"} subtitle="Successful + failed" />
        <StatCard title="Contracts Registered" value={contracts.count ?? "—"} subtitle="Via Lumina Registry" />
        <StatCard title="Avg Ledger Time" value="~5s" subtitle="Protocol target, not a live average" />
      </div>

      <h2 className="font-extrabold text-base mb-3.5 text-[var(--color-text-primary)]">Operation Type Breakdown</h2>
      <p className="text-xs text-[var(--color-text-muted)] mb-3">Based on the most recent {indexed.length} indexed operations.</p>
      <div className="border border-[var(--color-border-default)] rounded-xl p-5 flex flex-col gap-3.5">
        {breakdown.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No operations indexed yet.</p>
        ) : (
          breakdown.map((op) => (
            <div key={op.label}>
              <div className="flex justify-between text-[13px] mb-1.5">
                <span className="font-semibold text-[var(--color-text-primary)]">{op.label}</span>
                <span className="mono text-[var(--color-text-muted)]">{op.pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--color-bg-overlay)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--color-accent-fill)]"
                  style={{ width: `${op.pct}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
