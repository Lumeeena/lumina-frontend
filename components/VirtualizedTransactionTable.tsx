"use client";

import { useRef, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Transaction } from "@/lib/types";
import TransactionRow from "./TransactionRow";

const ROW_HEIGHT = 41;
const OVERSCAN = 12;
const th =
  "text-left text-[11px] tracking-[0.06em] uppercase text-[#a6a3b0] px-3 py-2.5 border-b border-[#e5e3ea] bg-[#fafafa]";

export default function VirtualizedTransactionTable({
  transactions,
  emptyMessage,
  children,
}: {
  transactions: Transaction[];
  emptyMessage: string | null;
  children: ReactNode;
}) {
  // TanStack Virtual exposes mutable instance methods that cannot be memoized.
  // Keep that boundary here so filtering, fetching and presets remain eligible.
  "use no memo";

  // ── Virtualization ──────────────────────────────────────────────────────

  const scrollRef = useRef<HTMLDivElement | null>(null);
  // eslint-disable-next-line react-hooks/incompatible-library -- mutable API is confined to this uncompiled component
  const virtualizer = useVirtualizer({
    count: transactions.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  // Spacer rows stand in for everything above and below the rendered window,
  // so the scrollbar reflects the whole list without the DOM holding it.
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - virtualRows[virtualRows.length - 1].end
      : 0;

  return (
    <div
      ref={scrollRef}
      data-testid="transaction-scroll"
      className="rounded-xl border border-[#e5e3ea] overflow-auto max-h-[70vh]"
    >
      <table className="w-full text-sm border-collapse">
        <thead className="sticky top-0 z-10">
          <tr>
            <th className={`${th} w-6`} />
            <th className={th}>Hash</th>
            <th className={th}>Ledger</th>
            <th className={th}>Source</th>
            <th className={th}>Ops</th>
            <th className={th}>Fee</th>
            <th className={th}>Time</th>
          </tr>
        </thead>
        <tbody>
          {paddingTop > 0 && (
            <tr aria-hidden="true">
              <td colSpan={7} style={{ height: paddingTop }} />
            </tr>
          )}
          {virtualRows.map((virtualRow) => (
            <TransactionRow
              key={transactions[virtualRow.index].hash}
              tx={transactions[virtualRow.index]}
            />
          ))}
          {paddingBottom > 0 && (
            <tr aria-hidden="true">
              <td colSpan={7} style={{ height: paddingBottom }} />
            </tr>
          )}
        </tbody>
      </table>

      {transactions.length === 0 && emptyMessage && (
        <div className="p-8 text-center text-[#a6a3b0] text-sm">
          {emptyMessage}
        </div>
      )}
      {children}
    </div>
  );
}
