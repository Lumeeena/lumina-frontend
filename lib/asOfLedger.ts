/**
 * The account page's "as of ledger" view, as it appears in the URL.
 *
 * `/accounts/G…?ledger=N` pins the page to the account as Lumina last recorded
 * it at or before ledger N (`account(address, asOfLedger)`). Without the
 * parameter the page shows the account's current state, as it always has.
 */

/** The search parameter that pins the account page to a ledger. */
export const AS_OF_LEDGER_PARAM = "ledger";

/**
 * The largest ledger the API accepts. `asOfLedger` is a GraphQL `Int`, a signed
 * 32-bit integer, so a larger value fails at the transport instead of reaching
 * the resolver — better turned away here with a message that says why.
 */
export const MAX_LEDGER_SEQUENCE = 2_147_483_647;

export type AsOfLedger =
  | { kind: "current" }
  | { kind: "ledger"; ledger: number }
  | { kind: "invalid"; raw: string };

/**
 * Read the parameter. Absent or blank means the current state, so submitting
 * the control empty is how the page goes back to it. Anything other than a
 * whole number from 1 to `MAX_LEDGER_SEQUENCE` is `invalid`, and the page says
 * so rather than asking the API a question it would reject.
 */
export function parseAsOfLedger(
  raw: string | string[] | undefined,
): AsOfLedger {
  // A repeated parameter arrives as an array; the first one is the one shown.
  const value = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  if (value === "") return { kind: "current" };
  if (!/^\d+$/.test(value)) return { kind: "invalid", raw: value };
  const ledger = Number(value);
  if (ledger < 1 || ledger > MAX_LEDGER_SEQUENCE) {
    return { kind: "invalid", raw: value };
  }
  return { kind: "ledger", ledger };
}

/** The account page pinned to `ledger`. */
export function accountAtLedgerHref(address: string, ledger: number): string {
  return `/accounts/${address}?${AS_OF_LEDGER_PARAM}=${ledger}`;
}
