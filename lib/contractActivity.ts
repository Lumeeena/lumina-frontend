/**
 * "Registered" and "actually being indexed" are different claims, and the
 * dashboard has to distinguish them: a contract can sit in the registry having
 * never emitted anything, either because it is unused or because the indexer
 * was never pointed at it.
 *
 * Activity is one `events(contractId, limit: 1)` query per contract. That is an
 * N+1, which is fine at the registry's current size and is why it is capped and
 * batched here rather than fired all at once — but it is the thing to replace
 * if the backend ever exposes a bulk "has events" lookup.
 */
import { ContractEvent } from "./types";

/**
 * The result of probing whether a registered contract has indexed activity.
 * There are three states, not two: a failed lookup is not "no activity".
 */
export type ActivityState = "active" | "quiet" | "unknown";

/** Fetch the most recent indexed events for one contract. */
export type EventProbe = (contractId: string) => Promise<ContractEvent[]>;

/** How many probes are in flight at once. */
const CONCURRENCY = 4;

/**
 * Probe registered contracts with bounded concurrency.
 *
 * Duplicate contract IDs are collapsed before probing. A failed request is
 * reported as `unknown`, rather than `quiet`, so an indexer outage cannot be
 * presented as proof that a contract has no activity. The optional
 * concurrency argument is clamped to at least one worker.
 */
export async function probeContractActivity(
  contractIds: string[],
  probe: EventProbe,
  concurrency: number = CONCURRENCY,
): Promise<Map<string, ActivityState>> {
  const result = new Map<string, ActivityState>();
  const queue = [...new Set(contractIds)];

  async function worker() {
    for (;;) {
      const contractId = queue.shift();
      if (!contractId) return;
      try {
        const events = await probe(contractId);
        result.set(contractId, events.length > 0 ? "active" : "quiet");
      } catch {
        result.set(contractId, "unknown");
      }
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.max(1, Math.min(concurrency, queue.length)) },
      worker,
    ),
  );

  return result;
}

import { t } from "@/lib/i18n";

const ACTIVITY_LABEL_KEYS: Record<ActivityState, Parameters<typeof t>[0]> = {
  active: "activity.indexed",
  quiet: "activity.noEvents",
  unknown: "activity.unknown",
};

/** Localized labels for the three activity states shown in the registry. */
export const ACTIVITY_LABELS: Record<ActivityState, string> = new Proxy(
  {} as Record<ActivityState, string>,
  { get: (_target, prop: ActivityState) => t(ACTIVITY_LABEL_KEYS[prop]) },
);
