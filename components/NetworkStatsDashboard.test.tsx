// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import type { Operation, Transaction } from "@/lib/types";

const LABELS: Record<string, string> = {
  "networkStats.activeAccounts": "Active accounts",
  "networkStats.sampledTransactions": "Sampled transactions",
  "networkStats.sampledOperations": "Sampled operations",
  "networkStats.successRate": "Success rate",
  "networkStats.operationsOverTime": "Operations over time",
  "networkStats.transactionsOverTime": "Transactions over time",
};

vi.mock("@/lib/i18n", () => ({
  t: vi.fn((key: string) => LABELS[key] ?? key),
  getLocale: () => "en-US",
}));

// Recharts needs layout APIs jsdom lacks; the stub exposes the data the
// dashboard passes in, which is what these tests are about.
vi.mock("@/components/charts/AreaChart", () => ({
  AreaChart: ({
    title,
    data,
  }: {
    title: string;
    data: Array<{ label: string; value: number }>;
  }) => (
    <section aria-label={title}>
      <ol>
        {data.map((point) => (
          <li key={point.label}>{point.value}</li>
        ))}
      </ol>
    </section>
  ),
}));

import NetworkStatsDashboard from "./NetworkStatsDashboard";

afterEach(cleanup);

const LEDGER = {
  sequence: 52_000_000,
  transactionCount: 120,
  operationCount: 300,
};

const op = (createdAt: string) => ({ createdAt }) as unknown as Operation;
const tx = (sourceAccount: string, successful: boolean, createdAt: string) =>
  ({ sourceAccount, successful, createdAt }) as unknown as Transaction;

/** The value shown on the stat card titled `title`. */
function stat(title: string): string {
  const term = screen
    .getAllByRole("term")
    .find((el) => el.textContent === title);
  const list = term?.closest("dl");
  if (!list) throw new Error(`no stat card for ${title}`);
  return (
    within(list).getByRole("definition").firstElementChild?.textContent ?? ""
  );
}

const chart = (title: string) => screen.queryByRole("region", { name: title });
const chartValues = (title: string) =>
  within(screen.getByRole("region", { name: title }))
    .getAllByRole("listitem")
    .map((item) => Number(item.textContent));

describe("NetworkStatsDashboard", () => {
  describe("loaded data", () => {
    const transactions = [
      tx("GA", true, "2026-11-20T10:00:00Z"),
      tx("GB", true, "2026-11-20T10:10:00Z"),
      tx("GA", false, "2026-11-20T12:00:00Z"),
    ];
    const operations = [
      op("2026-11-20T10:00:00Z"),
      op("2026-11-20T10:10:00Z"),
      op("2026-11-20T10:05:00Z"),
      op("2026-11-20T12:00:00Z"),
    ];

    it("summarises the sample on the stat cards", () => {
      render(
        <NetworkStatsDashboard
          latestLedger={LEDGER}
          operations={operations}
          transactions={transactions}
        />,
      );

      expect(stat("Active accounts")).toBe("2");
      expect(stat("Sampled transactions")).toBe("3");
      expect(stat("Sampled operations")).toBe("4");
      // 2 of 3 successful, rounded.
      expect(stat("Success rate")).toBe("67%");
    });

    it("buckets operations and transactions by hour, oldest first", () => {
      render(
        <NetworkStatsDashboard
          latestLedger={LEDGER}
          operations={operations}
          transactions={transactions}
        />,
      );

      expect(chartValues("Operations over time")).toEqual([3, 1]);
      expect(chartValues("Transactions over time")).toEqual([2, 1]);
    });

    it("sorts hourly buckets even when the sample arrives newest first", () => {
      const reversed = [...operations].reverse();
      render(
        <NetworkStatsDashboard
          latestLedger={LEDGER}
          operations={reversed}
          transactions={[]}
        />,
      );

      expect(chartValues("Operations over time")).toEqual([3, 1]);
    });

    it("reports 100% when every sampled transaction succeeded", () => {
      render(
        <NetworkStatsDashboard
          latestLedger={LEDGER}
          operations={[]}
          transactions={[tx("GA", true, "2026-11-20T10:00:00Z")]}
        />,
      );
      expect(stat("Success rate")).toBe("100%");
    });
  });

  describe("empty data", () => {
    it("shows zeroes and no charts", () => {
      render(
        <NetworkStatsDashboard
          latestLedger={LEDGER}
          operations={[]}
          transactions={[]}
        />,
      );

      expect(stat("Active accounts")).toBe("0");
      expect(stat("Sampled transactions")).toBe("0");
      expect(stat("Sampled operations")).toBe("0");
      expect(stat("Success rate")).toBe("0%");
      expect(chart("Operations over time")).not.toBeInTheDocument();
      expect(chart("Transactions over time")).not.toBeInTheDocument();
    });

    it("shows only the chart that has data", () => {
      render(
        <NetworkStatsDashboard
          latestLedger={LEDGER}
          operations={[op("2026-11-20T10:00:00Z")]}
          transactions={[]}
        />,
      );

      expect(chart("Operations over time")).toBeInTheDocument();
      expect(chart("Transactions over time")).not.toBeInTheDocument();
      // No transactions must not divide by zero.
      expect(stat("Success rate")).toBe("0%");
    });
  });

  describe("unavailable data", () => {
    it("renders the zero state when the backend returned nothing", () => {
      render(
        <NetworkStatsDashboard
          latestLedger={null}
          operations={[]}
          transactions={[]}
        />,
      );

      expect(stat("Sampled transactions")).toBe("0");
      expect(stat("Success rate")).toBe("0%");
      expect(screen.queryAllByRole("region")).toHaveLength(0);
    });

    it("still summarises a sample when the latest ledger is unknown", () => {
      render(
        <NetworkStatsDashboard
          latestLedger={null}
          operations={[op("2026-11-20T10:00:00Z")]}
          transactions={[tx("GA", true, "2026-11-20T10:00:00Z")]}
        />,
      );

      expect(stat("Active accounts")).toBe("1");
      expect(chart("Operations over time")).toBeInTheDocument();
    });
  });
});
