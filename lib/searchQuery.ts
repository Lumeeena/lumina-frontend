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

export type SearchKind = "account" | "contract" | "transaction" | "memo";

export interface ClassifiedSearch {
  kind: SearchKind;
  /**
   * The value in the form its destination page expects: addresses uppercased
   * (Stellar's canonical form), hashes lowercased, memo text trimmed.
   */
  value: string;
}

/**
 * Classify a raw search string by shape.
 *
 * Returns `null` for empty input — there is nothing to route, and the caller
 * should leave the user where they are rather than sending them anywhere.
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
 * The page a classified search routes to.
 *
 * Account and contract ids are exact lookups, so they go to their own pages;
 * a memo search is a query the backend ranks, so it goes to the results page
 * with the text in the URL — the search is then shareable and survives a
 * refresh.
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

/** What the input's live hint calls each kind, as it is being typed. */
export const SEARCH_KIND_LABEL: Record<SearchKind, string> = {
  account: "Account",
  contract: "Contract",
  transaction: "Transaction",
  memo: "Memo search",
};
