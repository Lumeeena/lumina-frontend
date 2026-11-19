// @vitest-environment jsdom
/**
 * Tests for VirtualizedTransactionTable (#457).
 *
 * The component has two rendering modes:
 *   - Desktop (window.innerWidth ≥ 768): a virtualized <table> whose row count
 *     is controlled by TanStack Virtual.
 *   - Mobile (window.innerWidth < 768): a flat card list, all rows rendered.
 *
 * We mock `useVirtualizer` to return all rows as virtual items so the desktop
 * path exercises the row-rendering logic without needing real DOM measurements.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import type { Transaction } from "@/lib/types";

// ── mock useVirtualizer ───────────────────────────────────────────────────
// The virtualizer calls `getScrollElement()` which returns null in jsdom, and
// it performs getBoundingClientRect measurements that only work in a real
// browser. Return all items as rendered virtual rows so we can test the
// actual row output.
vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: ({ count, estimateSize }: { count: number; estimateSize: () => number }) => {
    const size = estimateSize();
    const items = Array.from({ length: count }, (_, i) => ({
      index: i,
      start: i * size,
      end: (i + 1) * size,
      size,
      key: i,
      lane: 0,
    }));
    return {
      getVirtualItems: () => items,
      getTotalSize: () => count * size,
    };
  },
}));

// ── mock @/lib/i18n ───────────────────────────────────────────────────────
vi.mock("@/lib/i18n", () => ({
  t: (key: string) => key,
}));

// ── mock child components that touch the network or router ────────────────
vi.mock("./TransactionRow", () => ({
  default: ({ tx }: { tx: Transaction }) => (
    <tr role="row" data-hash={tx.hash}>
      <td>{tx.hash.slice(0, 8)}</td>
      <td>{tx.ledger}</td>
    </tr>
  ),
}));

vi.mock("./TimeAgo", () => ({ default: ({ isoString }: { isoString: string }) => <span>{isoString}</span> }));
vi.mock("./WatchIndicator", () => ({ default: () => null }));
vi.mock("./Table", () => ({
  Table: ({ children, emptyMessage, afterTable, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="table-root" {...props}>
      {emptyMessage && <p role="status">{String(emptyMessage)}</p>}
      <table>{children}</table>
      {afterTable}
    </div>
  ),
  TableHead: ({ children }: React.PropsWithChildren) => <thead>{children}</thead>,
  TableBody: ({ children }: React.PropsWithChildren) => <tbody>{children}</tbody>,
  TableHeaderCell: ({ children }: React.PropsWithChildren) => <th scope="col">{children}</th>,
  TableCell: ({ children }: React.PropsWithChildren) => <td>{children}</td>,
  TableRow: ({ children }: React.PropsWithChildren) => <tr>{children}</tr>,
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

import VirtualizedTransactionTable from "./VirtualizedTransactionTable";

// ── helpers ───────────────────────────────────────────────────────────────

function tx(n: number): Transaction {
  return {
    hash: `hash${String(n).padStart(60, "0")}`,
    ledger: 1000 + n,
    createdAt: new Date().toISOString(),
    sourceAccount: `GABC${String(n).padStart(52, "0")}`,
    feeCharged: "100",
    operationCount: 1,
    successful: true,
    memoType: null,
    memo: null,
  };
}

const count = (n: number) => Array.from({ length: n }, (_, i) => tx(i + 1));

function setWidth(px: number) {
  Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: px });
  window.dispatchEvent(new Event("resize"));
}

beforeEach(() => setWidth(1280));
afterEach(cleanup);

// ── tests ─────────────────────────────────────────────────────────────────

describe("VirtualizedTransactionTable (#457) — desktop", () => {
  it("renders a row for each transaction", () => {
    render(
      <VirtualizedTransactionTable transactions={count(5)} emptyMessage={null}>
        <div />
      </VirtualizedTransactionTable>,
    );
    // TransactionRow mock renders role="row"; body rows come from tbody.
    const rows = screen.getAllByRole("row");
    // 5 data rows; the header row also has role="row" so total >= 5.
    expect(rows.length).toBeGreaterThanOrEqual(5);
  });

  it("renders each transaction's hash in truncated form", () => {
    const txs = count(3);
    render(
      <VirtualizedTransactionTable transactions={txs} emptyMessage={null}>
        <div />
      </VirtualizedTransactionTable>,
    );
    // Each TransactionRow mock renders the first 8 chars of the hash.
    for (const t of txs) {
      expect(screen.getByText(t.hash.slice(0, 8))).toBeTruthy();
    }
  });

  it("renders an empty message when there are no transactions", () => {
    render(
      <VirtualizedTransactionTable transactions={[]} emptyMessage="No transactions found">
        <div />
      </VirtualizedTransactionTable>,
    );
    expect(screen.getByRole("status").textContent).toBe("No transactions found");
  });

  it("does not render an empty message when transactions exist", () => {
    render(
      <VirtualizedTransactionTable transactions={count(2)} emptyMessage="fallback">
        <div />
      </VirtualizedTransactionTable>,
    );
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("renders children (pagination controls etc.)", () => {
    render(
      <VirtualizedTransactionTable transactions={count(2)} emptyMessage={null}>
        <button>Load more</button>
      </VirtualizedTransactionTable>,
    );
    expect(screen.getByRole("button", { name: "Load more" })).toBeTruthy();
  });
});

describe("VirtualizedTransactionTable (#457) — mobile", () => {
  beforeEach(() => setWidth(375));

  it("renders all cards (not a table) on narrow viewports", () => {
    render(
      <VirtualizedTransactionTable transactions={count(4)} emptyMessage={null}>
        <div />
      </VirtualizedTransactionTable>,
    );
    // Mobile layout renders each tx as a card; no <table> element.
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("renders every transaction in the mobile card list", () => {
    const txs = count(3);
    render(
      <VirtualizedTransactionTable transactions={txs} emptyMessage={null}>
        <div />
      </VirtualizedTransactionTable>,
    );
    // Each card shows the first 12 chars of the hash + "…"
    for (const t of txs) {
      expect(screen.getByText(`${t.hash.slice(0, 12)}…`)).toBeTruthy();
    }
  });

  it("renders children after the card list", () => {
    render(
      <VirtualizedTransactionTable transactions={count(1)} emptyMessage={null}>
        <button>Mobile load more</button>
      </VirtualizedTransactionTable>,
    );
    expect(screen.getByRole("button", { name: "Mobile load more" })).toBeTruthy();
  });
});
