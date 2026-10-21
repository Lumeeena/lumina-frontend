interface Precondition {
  minLedger?: number;
  maxLedger?: number;
  minTime?: string;
  maxTime?: string;
  extraSigners?: string[];
}

interface TransactionPreconditionsProps {
  preconditions?: Precondition | null;
}

export default function TransactionPreconditions({
  preconditions,
}: TransactionPreconditionsProps) {
  if (!preconditions) {
    return null;
  }

  const hasPreconditions =
    preconditions.minLedger ||
    preconditions.maxLedger ||
    preconditions.minTime ||
    preconditions.maxTime ||
    (preconditions.extraSigners && preconditions.extraSigners.length > 0);

  if (!hasPreconditions) {
    return null;
  }

  const formatTime = (isoString: string) => {
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
  };

  return (
    <div className="rounded-xl border border-[var(--color-border-default)] overflow-hidden">
      <table className="w-full text-sm border-collapse">
        <tbody>
          {(preconditions.minLedger || preconditions.maxLedger) && (
            <tr className="border-b border-[var(--color-bg-overlay)]">
              <td className="py-2.5 px-3 text-[var(--color-text-muted)] text-xs w-[140px]">
                Ledger Bounds
              </td>
              <td className="py-2.5 px-3 mono text-xs text-[var(--color-text-primary)]">
                {preconditions.minLedger
                  ? `${preconditions.minLedger.toLocaleString()}`
                  : "—"}{" "}
                to{" "}
                {preconditions.maxLedger
                  ? `${preconditions.maxLedger.toLocaleString()}`
                  : "—"}
              </td>
            </tr>
          )}
          {(preconditions.minTime || preconditions.maxTime) && (
            <tr className="border-b border-[var(--color-bg-overlay)]">
              <td className="py-2.5 px-3 text-[var(--color-text-muted)] text-xs">
                Time Bounds
              </td>
              <td className="py-2.5 px-3 text-xs text-[var(--color-text-primary)]">
                <div className="space-y-1">
                  {preconditions.minTime && (
                    <div>From: {formatTime(preconditions.minTime)}</div>
                  )}
                  {preconditions.maxTime && (
                    <div>Until: {formatTime(preconditions.maxTime)}</div>
                  )}
                </div>
              </td>
            </tr>
          )}
          {preconditions.extraSigners &&
            preconditions.extraSigners.length > 0 && (
              <tr>
                <td className="py-2.5 px-3 text-[var(--color-text-muted)] text-xs align-top">
                  Extra Signers
                </td>
                <td className="py-2.5 px-3">
                  <div className="space-y-1">
                    {preconditions.extraSigners.map((signer) => (
                      <div
                        key={signer}
                        className="mono text-xs text-[var(--color-text-primary)] break-all"
                      >
                        {signer}
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            )}
        </tbody>
      </table>
    </div>
  );
}
