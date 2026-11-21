import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/FormField";
import {
  AS_OF_LEDGER_PARAM,
  MAX_LEDGER_SEQUENCE,
  type AsOfLedger,
} from "@/lib/asOfLedger";

export interface AccountAsOfLedgerProps {
  address: string;
  /** What the URL asked for. */
  view: AsOfLedger;
  /**
   * For a pinned view: the ledger of the recorded state being shown, or null
   * when Lumina has no recorded state at or before the requested ledger.
   */
  recordedLedger?: number | null;
  /** Carried across a submission, so the network switcher keeps its selection. */
  network?: string;
}

/**
 * The account page's "as of ledger" control, and what a pinned view means.
 *
 * A plain GET form: submitting it is a navigation to `?ledger=N`, so the URL is
 * the state, the pinned page can be shared, and no client JavaScript is needed.
 *
 * The explanations follow the API's contract (`account(asOfLedger:)`): the
 * answer is the latest state the indexer recorded at or before the ledger, not
 * a reconstruction, and null means no recorded state, not that the account
 * did not exist.
 */
export default function AccountAsOfLedger({
  address,
  view,
  recordedLedger = null,
  network,
}: AccountAsOfLedgerProps) {
  const path = `/accounts/${address}`;
  const currentHref = network
    ? `${path}?network=${encodeURIComponent(network)}`
    : path;

  return (
    <div className="mb-8">
      <form
        method="get"
        action={path}
        aria-label="View this account as of a past ledger"
        className="flex flex-wrap items-end gap-3"
      >
        {network && <input type="hidden" name="network" value={network} />}
        <TextField
          id="as-of-ledger"
          name={AS_OF_LEDGER_PARAM}
          label="As of ledger"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          placeholder="Ledger sequence"
          defaultValue={
            view.kind === "ledger"
              ? String(view.ledger)
              : view.kind === "invalid"
                ? view.raw
                : ""
          }
          error={
            view.kind === "invalid"
              ? `“${view.raw}” is not a ledger sequence. Enter a whole number from 1 to ${MAX_LEDGER_SEQUENCE.toLocaleString("en-US")}.`
              : undefined
          }
          className="w-56"
        />
        <Button type="submit" variant="secondary" size="sm" className="mb-px">
          View
        </Button>
        {view.kind !== "current" && (
          <Link
            href={currentHref}
            className="text-[13px] font-semibold text-[var(--color-accent-text)] hover:text-[var(--color-accent-text-hover)] hover:underline mb-2"
          >
            View current state
          </Link>
        )}
      </form>

      {view.kind === "ledger" &&
        (recordedLedger === null ? (
          <div className="mt-4 rounded-lg border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-4">
            <p className="font-semibold text-sm text-[var(--color-warning-text)] mb-1">
              No recorded state at or before ledger{" "}
              {view.ledger.toLocaleString("en-US")}
            </p>
            <p className="text-sm text-[var(--color-warning-text)]">
              Lumina has not stored a copy of this account at or before that
              ledger. That does not mean the account did not exist then: either
              it was not observed, because history starts when this deployment
              began recording account changes, or the copies from that time have
              been pruned.
            </p>
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-accent-surface)] p-4">
            <p className="font-semibold text-sm text-[var(--color-text-primary)] mb-1">
              Viewing this account as of ledger{" "}
              {view.ledger.toLocaleString("en-US")}
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              This is the latest state Lumina recorded at or before that ledger,
              from ledger {recordedLedger.toLocaleString("en-US")}.
              {recordedLedger < view.ledger &&
                ` If the account changed between ledgers ${recordedLedger.toLocaleString("en-US")} and ${view.ledger.toLocaleString("en-US")}, Lumina did not record it.`}{" "}
              Activity, charts and trustline history describe the account today,
              so they are left out of this view.
            </p>
          </div>
        ))}
    </div>
  );
}
