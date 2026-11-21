"use client";

import { useMemo } from "react";
import { AreaChart, type AreaChartPoint } from "@/components/charts/AreaChart";
import StatCard from "@/components/StatCard";
import type { Operation, Transaction } from "@/lib/types";

interface NetworkStatsDashboardProps {
  latestLedger: {
    sequence: number;
    transactionCount: number;
    operationCount: number;
  } | null;
  operations: Operation[];
  transactions: Transaction[];
}

export default function NetworkStatsDashboard({
  latestLedger,
  operations,
  transactions,
}: NetworkStatsDashboardProps) {
  const stats = useMemo(() => {
    const activeAccounts = new Set(
      transactions.map((tx) => tx.sourceAccount)
    );

    const operationsByHour = new Map<string, number>();
    const transactionsByHour = new Map<string, number>();
    let totalSuccessful = 0;
    let totalFailed = 0;

    for (const op of operations) {
      const date = new Date(op.createdAt);
      const hourKey = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours()
      ).toISOString();

      operationsByHour.set(hourKey, (operationsByHour.get(hourKey) ?? 0) + 1);
    }

    for (const tx of transactions) {
      const date = new Date(tx.createdAt);
      const hourKey = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours()
      ).toISOString();

      transactionsByHour.set(hourKey, (transactionsByHour.get(hourKey) ?? 0) + 1);
      if (tx.successful) {
        totalSuccessful += 1;
      } else {
        totalFailed += 1;
      }
    }

    const opsChartData: AreaChartPoint[] = Array.from(operationsByHour)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([timestamp, count]) => ({
        label: new Date(timestamp).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        value: count,
      }));

    const txChartData: AreaChartPoint[] = Array.from(transactionsByHour)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([timestamp, count]) => ({
        label: new Date(timestamp).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        value: count,
      }));

    return {
      activeAccounts: activeAccounts.size,
      totalTransactions: transactions.length,
      totalOperations: operations.length,
      successRate:
        transactions.length > 0
          ? Math.round((totalSuccessful / transactions.length) * 100)
          : 0,
      opsChartData,
      txChartData,
    };
  }, [operations, transactions]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Active Accounts"
          value={stats.activeAccounts}
          subtitle="In sampled data"
        />
        <StatCard
          title="Sampled Transactions"
          value={stats.totalTransactions}
          subtitle="Most recent"
        />
        <StatCard
          title="Sampled Operations"
          value={stats.totalOperations}
          subtitle="Most recent"
        />
        <StatCard
          title="Success Rate"
          value={`${stats.successRate}%`}
          subtitle="In sampled transactions"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stats.opsChartData.length > 0 && (
          <AreaChart
            title="Operations Over Time"
            description="Hourly operation volume from recent indexed data"
            data={stats.opsChartData}
            unit=" ops"
            caption="Based on the most recent indexed operations"
            emptyMessage="No operation data available"
          />
        )}

        {stats.txChartData.length > 0 && (
          <AreaChart
            title="Transactions Over Time"
            description="Hourly transaction volume from recent indexed data"
            data={stats.txChartData}
            unit=" txs"
            caption="Based on the most recent indexed transactions"
            emptyMessage="No transaction data available"
          />
        )}
      </div>
    </div>
  );
}
