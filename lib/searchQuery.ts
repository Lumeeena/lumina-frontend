/**
 * Universal search classification.
 *
 * Every explorer has one search box that works out what it was given, so the
 * user never has to classify their own input first. Classification is by
 * shape alone — the strings are unambiguous:
 *
 * - `G…` (56 Strkey characters) is a Stellar account address.
 * - `C…` (56 Strkey characters) is a Soroban contract id.
 * - 64 hexadecimal characters is a transaction hash.
 * - Anything else is not a shape the chain indexes by address, so it is
 *   handed to the backend's memo search as free text.
 *
 * The shapes are checked by pattern, never by asking the backend "is this an
 * account?": routing on a 56-character `G…` string has to be instant, and an
 * address the indexer has never seen is still an account page — it is simply
 * an account with nothing on it yet.
 */

/** Strkey's base32 alphabet: A–Z and 2–7. Input is case-insensitive, so shapes are tested against the uppercased form. */
const ACCOUNT_SHAPE = /^G[A-Z2-7]{55}$/;
const CONTRACT_SHAPE = /^C[A-Z2-7]{55}$/;
const TX_HASH_SHAPE = /^[0-9a-fA-F]{64}$/;

/**
 * Destination categories recognized by {@link classifySearch}: Stellar
 * account ID, Soroban contract ID, transaction hash, or free-text memo search.
 */
export type SearchKind = "account" | "contract" | "transaction" | "memo";

/** A non-empty search classified and normalized for display or routing. */
export interface ClassifiedSearch {
  /** The destination category inferred from the input's shape. */
  kind: SearchKind;
  /**
   * The value in the form its destination page expects: addresses uppercased
   * (Stellar's canonical form), hashes lowercased, memo text trimmed.
   */
  value: string;
}

/**
 * Classify and normalize a search string for the universal search box. Use the
 * result for its live kind hint and to choose a destination with
 * {@link searchHref}.
 *
 * Classification is deliberately local and shape-only, with no backend lookup:
 * an address not yet indexed still routes to its account page immediately.
 * It checks StrKey prefix, length and alphabet, but not the address checksum or
 * existence. Exactly 64 hexadecimal characters are treated as a transaction
 * hash; anything else non-empty, including near-matches and short hex strings,
 * is memo text.
 *
 * Returns `null` for empty input — there is nothing to route, and the caller
 * should leave the user where they are rather than sending them anywhere.
 * Surrounding whitespace is removed; addresses are uppercased, hashes are
 * lowercased, and memo text otherwise retains its case.
 *
 * @param raw User-entered search text.
 * @returns A normalized classification, or `null` if the trimmed input is empty.
 */
export function classifySearch(raw: string): ClassifiedSearch | null {
  const query = raw.trim();
  if (!query) return null;

  // Strkey is case-insensitive: a pasted address may be either case. The
  // shape is tested on the uppercased form; the memo keeps its own.
  const upper = query.toUpperCase();
  if (ACCOUNT_SHAPE.test(upper)) {
    return { kind: "account", value: upper };
  }
  if (CONTRACT_SHAPE.test(upper)) {
    return { kind: "contract", value: upper };
  }
  if (TX_HASH_SHAPE.test(query)) {
    return { kind: "transaction", value: query.toLowerCase() };
  }
  return { kind: "memo", value: query };
}

/**
 * Build the internal URL for a classified search. Pass the result of
 * {@link classifySearch}; account IDs, contract IDs and hashes become direct
 * route values, while memo text is URL-encoded in the `/search?q=` query.
 *
 * Account and contract ids are exact lookups, so they go to their own pages;
 * a memo search is a query the backend ranks, so it goes to the results page
 * with the text in the URL — the search is then shareable and survives a
 * refresh. This function does not validate or normalize a manually constructed
 * {@link ClassifiedSearch}.
 *
 * @param search The classified kind and normalized value to route.
 * @returns An internal URL for the account, events, transaction or memo search page.
 */
export function searchHref({ kind, value }: ClassifiedSearch): string {
  switch (kind) {
    case "account":
      return `/accounts/${value}`;
    case "contract":
      return `/events?contractId=${value}`;
    case "transaction":
      return `/transactions/${value}`;
    case "memo":
      return `/search?q=${encodeURIComponent(value)}`;
  }
}

/**
 * Human-readable labels for the live search-kind hint, keyed by
 * {@link SearchKind}.
 */
export const SEARCH_KIND_LABEL: Record<SearchKind, string> = {
  account: "Account",
  contract: "Contract",
  transaction: "Transaction",
  memo: "Memo search",
};
