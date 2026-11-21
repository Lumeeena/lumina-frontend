/**
 * Shaping `accountBalanceHistory` for a chart.
 *
 * The backend replays balance-affecting operations and returns one snapshot
 * per change, starting with the balance at the beginning of the range. Those
 * timestamps are irregular, and a chart with evenly spaced points would stretch
 * a busy afternoon across as much width as a quiet month, so the history is
 * sampled once a day instead.
 */

const DAY_MS = 86_400_000;

/**
 * The backend's documented maximum range. A longer one is rejected with an
 * error rather than truncated, so the chart never asks for more than this.
 */
export const BALANCE_HISTORY_DAYS = 90;

export interface BalanceHistoryRange {
  from: string;
  to: string;
}

/**
 * The range to request, ending now.
 *
 * Both ends are sent, from one clock: with `to` left to the server, a client
 * clock running behind it would stretch the range past the limit.
 */
export function balanceHistoryRange(nowMs: number): BalanceHistoryRange {
  return {
    from: new Date(nowMs - BALANCE_HISTORY_DAYS * DAY_MS).toISOString(),
    to: new Date(nowMs).toISOString(),
  };
}

export interface BalanceSnapshotInput {
  timestamp: string;
  balance: string;
}

export interface BalanceSample {
  /** The instant sampled (ISO-8601). */
  at: string;
  /** The balance at that instant, as the decimal string the API sent. */
  balance: string;
}

/**
 * The balance once a day from `from` to `to`, plus `to` itself.
 *
 * Each sample is the balance after the last change at or before it. Samples
 * before the first snapshot are left out rather than guessed at: the API sends
 * a snapshot at the start of the range whenever it knows the balance there, so
 * a missing one means it did not. No snapshots at all is an empty series.
 */
export function dailyBalances(
  snapshots: readonly BalanceSnapshotInput[],
  from: string,
  to: string,
): BalanceSample[] {
  const changes = snapshots
    .map((s) => ({ at: Date.parse(s.timestamp), balance: s.balance }))
    .filter((s) => Number.isFinite(s.at))
    .sort((a, b) => a.at - b.at);
  const start = Date.parse(from);
  const end = Date.parse(to);
  if (changes.length === 0 || !(start <= end)) return [];

  const instants: number[] = [];
  for (let t = start; t < end; t += DAY_MS) instants.push(t);
  instants.push(end);

  const samples: BalanceSample[] = [];
  let next = 0;
  let current: string | null = null;
  for (const t of instants) {
    while (next < changes.length && changes[next].at <= t) {
      current = changes[next].balance;
      next++;
    }
    if (current !== null) {
      samples.push({ at: new Date(t).toISOString(), balance: current });
    }
  }
  return samples;
}

/** A sample's date as a short axis label, e.g. "Nov 21", in the reader's locale. */
export function sampleLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
