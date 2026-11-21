interface IndexingGap {
  startLedger: number;
  endLedger: number;
}

interface IndexingGapIndicatorProps {
  gaps?: IndexingGap[] | null;
  viewedLedgerStart?: number;
  viewedLedgerEnd?: number;
}

export default function IndexingGapIndicator({
  gaps,
  viewedLedgerStart,
  viewedLedgerEnd,
}: IndexingGapIndicatorProps) {
  if (!gaps || gaps.length === 0) {
    return null;
  }

  let relevantGaps: IndexingGap[] = gaps;

  if (viewedLedgerStart !== undefined && viewedLedgerEnd !== undefined) {
    relevantGaps = gaps.filter(
      (gap) =>
        !(gap.endLedger < viewedLedgerStart || gap.startLedger > viewedLedgerEnd)
    );
  }

  if (relevantGaps.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg bg-[var(--color-warning-bg)] border border-[var(--color-warning-border)] p-4 mb-6">
      <div className="flex gap-3">
        <div
          className="text-[var(--color-warning-text)] flex-shrink-0 mt-0.5"
          aria-hidden="true"
        >
          ⚠️
        </div>
        <div>
          <h3 className="font-semibold text-sm text-[var(--color-warning-text)] mb-1">
            Incomplete Indexing
          </h3>
          <p className="text-sm text-[var(--color-warning-text)] opacity-90 mb-3">
            The data you are viewing includes gaps in indexing. Some transactions
            or operations in this range may not be indexed yet.
          </p>
          <div className="space-y-1">
            {relevantGaps.map((gap, idx) => (
              <div
                key={idx}
                className="text-xs text-[var(--color-warning-text)] opacity-90 mono"
              >
                Gap: ledgers{" "}
                {gap.startLedger.toLocaleString()} to{" "}
                {gap.endLedger.toLocaleString()}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
