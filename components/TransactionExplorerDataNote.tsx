import IndexingGapIndicator from "@/components/IndexingGapIndicator";

interface Gap {
  startLedger: number;
  endLedger: number;
}

interface TransactionExplorerDataNoteProps {
  gaps?: Gap[] | null;
  dataStartLedger?: number;
  dataEndLedger?: number;
}

export default function TransactionExplorerDataNote({
  gaps,
  dataStartLedger,
  dataEndLedger,
}: TransactionExplorerDataNoteProps) {
  return (
    <div className="space-y-4">
      {gaps && gaps.length > 0 && (
        <IndexingGapIndicator
          gaps={gaps}
          viewedLedgerStart={dataStartLedger}
          viewedLedgerEnd={dataEndLedger}
        />
      )}
      <div className="rounded-lg bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] p-4">
        <p className="text-xs text-[var(--color-text-muted)]">
          <strong>About this data:</strong> The transactions and operations
          displayed are from the Lumina indexer, which indexes confirmed
          transactions on the Stellar network. Data freshness and completeness
          depend on the indexer's current state.
        </p>
      </div>
    </div>
  );
}
