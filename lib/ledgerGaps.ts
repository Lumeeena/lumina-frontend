/** An inclusive run of ledger sequences the index has no row for. */
export interface LedgerGap {
  startLedger: number;
  endLedger: number;
}

/**
 * The runs of missing sequences between the ledgers on one page.
 *
 * `ledgers` only returns indexed rows, and a ledger's sequence is its position
 * in the chain, so any jump of more than one between neighbours is a stretch
 * the indexer has not filled. Gaps come back newest first, matching the table.
 *
 * Only the space between the rows given is checked: a run that falls exactly on
 * a page boundary has no neighbour on either page to reveal it.
 */
export function findLedgerGaps(sequences: readonly number[]): LedgerGap[] {
  // Sorted rather than trusted, so a reordered or repeated row cannot invent a
  // gap or hide one.
  const ordered = [...new Set(sequences)].sort((a, b) => b - a);
  const gaps: LedgerGap[] = [];
  for (let i = 1; i < ordered.length; i++) {
    const newer = ordered[i - 1];
    const older = ordered[i];
    if (newer - older > 1) {
      gaps.push({ startLedger: older + 1, endLedger: newer - 1 });
    }
  }
  return gaps;
}
