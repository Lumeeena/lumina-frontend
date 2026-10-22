// Helper functions for working with transaction preconditions

export interface TransactionPreconditions {
  minLedger?: number | null;
  maxLedger?: number | null;
  minTime?: string | null;
  maxTime?: string | null;
  extraSigners?: string[] | null;
}

export function hasPreconditions(preconditions?: TransactionPreconditions | null): boolean {
  if (!preconditions) {
    return false;
  }

  return !!(
    preconditions.minLedger ||
    preconditions.maxLedger ||
    preconditions.minTime ||
    preconditions.maxTime ||
    (preconditions.extraSigners && preconditions.extraSigners.length > 0)
  );
}

export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

export function getPreconditionSummary(preconditions?: TransactionPreconditions | null): string[] {
  if (!preconditions || !hasPreconditions(preconditions)) {
    return [];
  }

  const parts: string[] = [];

  if (preconditions.minLedger || preconditions.maxLedger) {
    const minStr = preconditions.minLedger ? preconditions.minLedger.toString() : "any";
    const maxStr = preconditions.maxLedger ? preconditions.maxLedger.toString() : "any";
    parts.push(`Ledger: ${minStr} - ${maxStr}`);
  }

  if (preconditions.minTime || preconditions.maxTime) {
    const minStr = preconditions.minTime ? new Date(preconditions.minTime).toLocaleDateString() : "any";
    const maxStr = preconditions.maxTime ? new Date(preconditions.maxTime).toLocaleDateString() : "any";
    parts.push(`Time: ${minStr} - ${maxStr}`);
  }

  if (preconditions.extraSigners && preconditions.extraSigners.length > 0) {
    parts.push(`Extra signers: ${preconditions.extraSigners.length}`);
  }

  return parts;
}
