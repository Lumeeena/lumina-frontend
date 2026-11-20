import type { Metadata } from "next";
import { gqlFetch, GRAPHQL_URL } from "@/lib/graphql";
import { StatsDocument } from "@/lib/generated/graphql";
import { routeMetadata } from "@/lib/metadata";
import { STATS } from "@/lib/routes";
import type { Operation } from "@/lib/types";
import { getActiveContracts } from "@/lib/registry";
import { formatOperationType } from "@/lib/formatters";
import StatCard from "@/components/StatCard";
import BackendUnavailable from "@/components/BackendUnavailable";
import NetworkStatsDashboard from "@/components/NetworkStatsDashboard";

export function generateMetadata(): Metadata {
  return routeMetadata(STATS);
}

/** Bucket returned by the backend's networkStats rollup query. */
interface NetworkStatsBucket {
  timestamp: string;
  transactionCount: number;
  operationCount: number;
}

/** Fetch network stats rollup from the backend (Lumeeena/lumina-backend#380). */
async function getNetworkStats(
  startTime: string,
  endTime: string,
  granularity: string,
): Promise<{ buckets: NetworkStatsBucket[] | null; unavailable: boolean }> {
  try {
    const response = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `query NetworkStats($startTime: String!, $endTime: String!, $granularity: String!) {
          networkStats(startTime: $startTime, endTime: $endTime, granularity: $granularity) {
            buckets { timestamp transactionCount operationCount }
          }
        }`,
        variables: { startTime, endTime, granularity },
      }),
      next: { revalidate: 300 },
    });
    if (!response.ok) return { buckets: null, unavailable: true };
    const json = (await response.json()) as {
      data?: { networkStats?: { buckets: NetworkStatsBucket[] } | null };
      errors?: unknown[];
    };
    const buckets = json.data?.networkStats?.buckets ?? null;
    return { buckets, unavailable: false };
  } catch {
    return { buckets: null, unavailable: true };
  }
}

async function getStats() {
  try {
    // opLimit is intentionally omitted: the breakdown section now shows a
    // modest recent sample only as supplementary context. The primary time-
    // series charts come from networkStats rollups (#373).
    const data = await gqlFetch(GRAPHQL_URL, StatsDocument, { opLimit: 50 });
    return { ...data, unavailable: false };
  } catch {
    return {
      latestLedger: null,
      operations: { items: [] },
      transactions: { items: [] },
      unavailable: true,
    };
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
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    { latestLedger, operations, transactions, unavailable },
    contracts,
    networkStats,
  ] = await Promise.all([
    getStats(),
    getContractsRegisteredCount(),
    getNetworkStats(dayAgo.toISOString(), now.toISOString(), "HOUR"),
  ]);

  const indexed = operations?.items ?? [];
  const txs = transactions?.items ?? [];
  const breakdown = opBreakdown(indexed);
  const rollupBuckets = networkStats.buckets;

  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12">
      <h1 className="font-extrabold text-3xl mb-2 text-[var(--color-text-primary)]">Network Stats</h1>
      <p className="text-[var(--color-text-secondary)] mb-8">Indexer health and Stellar network throughput at a glance.</p>
      {unavailable && <BackendUnavailable />}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-9">
        <StatCard title="Latest Ledger" value={latestLedger ? latestLedger.sequence.toLocaleString() : "—"} subtitle="Stellar Mainnet" />
        <StatCard title="Ledger Transactions" value={latestLedger ? latestLedger.transactionCount.toLocaleString() : "—"} subtitle="Latest ledger" />
        <StatCard title="Contracts Registered" value={contracts.count ?? "—"} subtitle="Via Lumina Registry" />
        <StatCard title="Avg Ledger Time" value="~5s" subtitle="Protocol target, not a live average" />
      </div>

      <div className="mb-12">
        {rollupBuckets && rollupBuckets.length > 0 ? (
          <NetworkStatsDashboard
            latestLedger={latestLedger}
            operations={indexed}
            transactions={txs}
            networkStatsBuckets={rollupBuckets}
          />
        ) : (
          <div>
            <NetworkStatsDashboard
              latestLedger={latestLedger}
              operations={indexed}
              transactions={txs}
            />
            <p className="text-xs text-[var(--color-text-muted)] mt-3">
              Time-series charts will be driven by backend network stats rollups once available
              (lumina-backend#380). The charts above reflect a small recent sample.
            </p>
          </div>
        )}
      </div>

      <h2 className="font-extrabold text-base mb-3.5 text-[var(--color-text-primary)]">Operation Type Breakdown</h2>
      <p className="text-xs text-[var(--color-text-muted)] mb-3">
        Based on the most recent {indexed.length} indexed operations.
      </p>
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
