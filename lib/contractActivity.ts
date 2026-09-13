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
import { ContractEvent } from './types';

/**
 * Three states, not two. A failed lookup is not "no activity" — showing a
 * healthy contract as quiet because one request timed out is a worse lie than
 * admitting we don't know.
 */
export type ActivityState = 'active' | 'quiet' | 'unknown';

export type EventProbe = (contractId: string) => Promise<ContractEvent[]>;

/** How many probes are in flight at once. */
const CONCURRENCY = 4;

export async function probeContractActivity(
  contractIds: string[],
  probe: EventProbe,
  concurrency: number = CONCURRENCY
): Promise<Map<string, ActivityState>> {
  const result = new Map<string, ActivityState>();
  const queue = [...new Set(contractIds)];

  async function worker() {
    for (;;) {
      const contractId = queue.shift();
      if (!contractId) return;
      try {
        const events = await probe(contractId);
        result.set(contractId, events.length > 0 ? 'active' : 'quiet');
      } catch {
        result.set(contractId, 'unknown');
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(concurrency, queue.length)) }, worker)
  );

  return result;
}

export const ACTIVITY_LABELS: Record<ActivityState, string> = {
  active: 'Indexed activity',
  quiet: 'No events yet',
  unknown: 'Activity unknown',
};
