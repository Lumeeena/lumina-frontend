/**
 * Contract writes this tab has submitted and not yet seen settle. Part of #255.
 *
 * A form that starts a write owns its phase in component state, so navigating
 * away unmounts the only thing showing progress. The write itself carries on —
 * its promise is still live — but the user is left without a way to tell. This
 * store holds the progress instead. It lives in module scope, which survives
 * client-side navigation because the root layout never remounts, and
 * `components/PendingTransactions.tsx` renders it there, so completion is shown
 * on whatever page the user is on.
 *
 * Modelled as an external store, like `lib/notifications.ts`, because the writer
 * (a form) and the reader (the layout) are not ancestors of one another.
 *
 * Deliberately free of React and of `lib/sorobanTx.ts` at runtime: the phase
 * type is imported for its shape only, so the store is testable without the
 * Stellar SDK.
 */
import type { TxPhase } from "./sorobanTx";
import { invalidateQueryCache } from "./queryCache";

/** Settled transactions kept for the indicator. In-flight ones are never dropped. */
export const MAX_SETTLED_TRANSACTIONS = 10;

export interface PendingTransaction {
  id: number;
  /** What the user will recognise, already translated, e.g. "Deactivate CABC…". */
  label: string;
  phase: TxPhase;
  /** Set once the write confirms. */
  hash: string | null;
  /** Set when the write fails. Empty when the failure carried no message. */
  error: string | null;
  startedAt: number;
}

const EMPTY: PendingTransaction[] = [];
let entries: PendingTransaction[] = EMPTY;
let nextId = 1;
const listeners = new Set<() => void>();

function publish(next: PendingTransaction[]): void {
  entries = next;
  for (const listener of listeners) listener();
}

export function isSettled(transaction: PendingTransaction): boolean {
  return transaction.phase === "success" || transaction.phase === "error";
}

/**
 * Run a contract write and track it until it settles.
 *
 * The transaction is listed before `run` starts, so it is visible from its
 * first phase. `report` feeds phase changes into the list. A success
 * invalidates the query cache, since the write may have changed what a cached
 * read shows. The promise settles exactly as `run`'s does: a failure is
 * recorded here and then rethrown, so the caller's own error handling still
 * runs.
 */
export function trackTransaction<T extends { hash: string }>(
  label: string,
  run: (report: (phase: TxPhase) => void) => Promise<T>,
): Promise<T> {
  const id = nextId++;
  publish([
    ...entries,
    { id, label, phase: "building", hash: null, error: null, startedAt: Date.now() },
  ]);

  const update = (patch: Partial<PendingTransaction>) => {
    publish(entries.map((tx) => (tx.id === id ? { ...tx, ...patch } : tx)));
  };

  return run((phase) => update({ phase })).then(
    (result) => {
      update({ phase: "success", hash: result.hash });
      invalidateQueryCache();
      trimSettled();
      return result;
    },
    (err: unknown) => {
      update({
        phase: "error",
        error: err instanceof Error && err.message ? err.message : null,
      });
      trimSettled();
      throw err;
    },
  );
}

/** Keep the newest settled entries; in-flight ones are always kept. */
function trimSettled(): void {
  const settled = entries.filter(isSettled);
  if (settled.length <= MAX_SETTLED_TRANSACTIONS) return;
  const drop = new Set(
    settled.slice(0, settled.length - MAX_SETTLED_TRANSACTIONS).map((tx) => tx.id),
  );
  publish(entries.filter((tx) => !drop.has(tx.id)));
}

/**
 * Remove a settled transaction from the indicator. An in-flight one is not
 * dismissable — removing it would hide a write that is still going.
 */
export function dismissTransaction(id: number): void {
  const target = entries.find((tx) => tx.id === id);
  if (!target || !isSettled(target)) return;
  publish(entries.filter((tx) => tx.id !== id));
}

export function getPendingTransactions(): PendingTransaction[] {
  return entries;
}

export function getServerPendingTransactions(): PendingTransaction[] {
  return EMPTY;
}

export function subscribePendingTransactions(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Test helper: empty the list between cases, since module state outlives a test. */
export function __resetPendingTransactions(): void {
  entries = EMPTY;
}
