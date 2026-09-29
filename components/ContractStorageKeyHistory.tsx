"use client";

import { useState } from "react";
import TimeAgo from "./TimeAgo";
import SorobanValue from "./SorobanValue";

interface StorageKeyHistoryEntry {
  value: unknown;
  ledger: number;
  createdAt: string;
}

interface ContractStorageKeyHistoryProps {
  contractId: string;
  storageKey: string;
  history: StorageKeyHistoryEntry[];
  currentValue: unknown;
  currentLedger: number;
  hasCompleteHistory: boolean;
}

/**
 * Display the history of changes to a contract storage key.
 *
 * Shows:
 * - Current value (most recent)
 * - Historical values (when backend provides them)
 * - Clear indication when only current value is available
 * - Each value's ledger and timestamp
 */
export default function ContractStorageKeyHistory({
  contractId,
  storageKey,
  history,
  currentValue,
  currentLedger,
  hasCompleteHistory,
}: ContractStorageKeyHistoryProps) {
  const [expandedLedger, setExpandedLedger] = useState<number | null>(
    currentLedger
  );

  const allEntries = [
    { value: currentValue, ledger: currentLedger, createdAt: new Date().toISOString(), isCurrent: true },
    ...history,
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">
          Value History
        </h3>
        {!hasCompleteHistory && (
          <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-subtle)] px-2 py-1 rounded">
            Current value only (history not yet indexed)
          </span>
        )}
      </div>

      <div className="space-y-3 border border-[var(--color-border-default)] rounded-lg overflow-hidden">
        {allEntries.map((entry, index) => (
          <div
            key={`${entry.ledger}-${index}`}
            className="border-b border-[var(--color-border-default)] last:border-0"
          >
            <button
              type="button"
              onClick={() =>
                setExpandedLedger(
                  expandedLedger === entry.ledger ? null : entry.ledger
                )
              }
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--color-bg-subtle)] transition-colors text-left"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="mono text-xs text-[var(--color-text-secondary)]">
                      Ledger {entry.ledger.toLocaleString()}
                    </span>
                    {entry.isCurrent && (
                      <span className="text-xs font-semibold text-[var(--color-success-text)] bg-[var(--color-success-bg)] px-1.5 py-0.5 rounded">
                        Current
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    <TimeAgo isoString={entry.createdAt} />
                  </span>
                </div>
              </div>
              <span className="text-[var(--color-text-muted)] ms-2">
                {expandedLedger === entry.ledger ? "−" : "+"}
              </span>
            </button>

            {expandedLedger === entry.ledger && (
              <div className="px-4 py-3 bg-[var(--color-bg-subtle)] border-t border-[var(--color-border-default)]">
                <div className="text-xs text-[var(--color-text-muted)] mb-2">
                  Value
                </div>
                <div className="bg-[var(--color-bg-base)] rounded p-3 border border-[var(--color-border-default)]">
                  <SorobanValue
                    value={entry.value}
                    initialExpandedDepth={3}
                    showRawToggle
                    rawValue={entry.value}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {!hasCompleteHistory && (
        <div className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-subtle)] p-3 rounded border border-[var(--color-border-default)]">
          <p className="font-semibold mb-1 text-[var(--color-text-secondary)]">
            Note: History not available yet
          </p>
          <p>
            The backend is not yet retaining historical contract storage values.
            Once this is implemented, you will see the complete change history
            for this key.
          </p>
        </div>
      )}
    </div>
  );
}
