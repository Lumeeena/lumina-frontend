"use client";

import { useSyncExternalStore } from "react";
import {
  dismissTransaction,
  getPendingTransactions,
  getServerPendingTransactions,
  isSettled,
  subscribePendingTransactions,
  type PendingTransaction,
} from "@/lib/pendingTransactions";
import type { TxPhase } from "@/lib/sorobanTx";
import { t } from "@/lib/i18n";

const PHASE_KEYS: Record<TxPhase, Parameters<typeof t>[0]> = {
  idle: "pending.building",
  building: "pending.building",
  "awaiting-signature": "pending.awaitingSignature",
  submitting: "pending.submitting",
  confirming: "pending.confirming",
  success: "pending.succeeded",
  error: "pending.failed",
};

/**
 * The transactions in flight or recently settled, pinned to the viewport.
 *
 * Mounted in the root layout so it is on every route: a write started on the
 * registry keeps its progress visible after the user has gone to look at
 * something else, and its outcome is reported where they are, not where they
 * started. Renders nothing when there is nothing to say.
 *
 * Settled rows carry `role="status"` (or `alert` on failure), so the outcome is
 * announced once. In-flight phase changes are not, because a phase change every
 * few seconds would be noise for a screen reader.
 */
export default function PendingTransactions() {
  const transactions = useSyncExternalStore(
    subscribePendingTransactions,
    getPendingTransactions,
    getServerPendingTransactions,
  );

  if (transactions.length === 0) return null;

  return (
    <section
      aria-label={t("pending.title")}
      className="fixed bottom-4 end-4 z-40 w-[min(22rem,calc(100vw-2rem))] max-h-[50vh] overflow-y-auto rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-base)] shadow-lg"
    >
      <h2 className="sr-only">{t("pending.title")}</h2>
      <ul className="divide-y divide-[var(--color-bg-overlay)]">
        {transactions.map((transaction) => (
          <PendingRow key={transaction.id} transaction={transaction} />
        ))}
      </ul>
    </section>
  );
}

function PendingRow({ transaction }: { transaction: PendingTransaction }) {
  const settled = isSettled(transaction);
  const failed = transaction.phase === "error";

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate">
          {transaction.label}
        </p>
        <p
          role={settled ? (failed ? "alert" : "status") : undefined}
          className={`text-xs ${
            failed
              ? "text-[var(--color-error-text)]"
              : transaction.phase === "success"
                ? "text-[var(--color-success-text)]"
                : "text-[var(--color-text-muted)]"
          }`}
        >
          {t(PHASE_KEYS[transaction.phase])}
          {failed && (transaction.error || ` · ${t("pending.failedFallback")}`)}
        </p>
      </div>

      {settled && (
        <button
          type="button"
          onClick={() => dismissTransaction(transaction.id)}
          aria-label={`${t("pending.dismiss")}: ${transaction.label}`}
          className="shrink-0 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-fill)]"
        >
          {t("pending.dismiss")}
        </button>
      )}
    </li>
  );
}
