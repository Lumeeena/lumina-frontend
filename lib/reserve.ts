/**
 * Stellar's minimum balance reserve, checked before a transaction is sent.
 *
 * Every account must hold a base amount of XLM that it cannot spend: two base
 * reserves for the account itself, plus one for each entry it owns (trustlines,
 * offers, data entries, signers). A transaction can succeed on the network and
 * still leave the account below that line, where it can no longer transact.
 * Nothing on the network stops that, so the check has to happen here.
 */

/** One base reserve: 0.5 XLM, in stroops. */
export const BASE_RESERVE_STROOPS = BigInt(5_000_000);

/**
 * The fee ceiling `createStellarDriver` will ever charge (`maxFee` in
 * `lib/sorobanTx.ts`). Counting the ceiling rather than the simulated fee means
 * the check is never optimistic about what the transaction will cost.
 */
export const WORST_CASE_FEE_STROOPS = BigInt(1_000_000);

export interface ReserveCheck {
  /** True when the transaction would leave the account below its reserve. */
  breaches: boolean;
  /** The lowest balance the account may keep, in stroops. */
  minimum: bigint;
  /** The balance left once the transaction's cost is paid, in stroops. */
  remaining: bigint;
}

/** The balance an account must keep, given how many entries it owns. */
export function minimumBalance(subentryCount: number): bigint {
  return BigInt(2 + subentryCount) * BASE_RESERVE_STROOPS;
}

/** Whether paying `cost` out of `balance` would dip below the account's reserve. */
export function checkReserve(
  balance: bigint,
  subentryCount: number,
  cost: bigint,
): ReserveCheck {
  const minimum = minimumBalance(subentryCount);
  const remaining = balance - cost;
  return { breaches: remaining < minimum, minimum, remaining };
}
