import { StrKey } from "@stellar/stellar-sdk";
import { t } from "@/lib/i18n";

/**
 * Universal search classification.
 *
 * Every explorer has one search box that works out what it was given, so the
 * user never has to classify their own input first. Classification is by
 * shape alone — the strings are unambiguous:
 *
 * - `G…` (56 Strkey characters) is a Stellar account address.
 * - `C…` (56 Strkey characters) is a Soroban contract id.
 * - `M…` (69 Strkey characters) is a muxed account address (SEP-0023).
 * - 64 hexadecimal characters is a transaction hash.
 * - Anything else is not a shape the chain indexes by address, so it is
 *   handed to the backend's memo search as free text.
 *
 * M-addresses resolve to their underlying G account for routing; the muxed
 * ID is preserved as a query parameter so the account page can display it.
 */

/** Strkey's base32 alphabet: A–Z and 2–7. Input is case-insensitive, so shapes are tested against the uppercased form. */
const ACCOUNT_SHAPE = /^G[A-Z2-7]{55}$/;
const CONTRACT_SHAPE = /^C[A-Z2-7]{55}$/;
const TX_HASH_SHAPE = /^[0-9a-fA-F]{64}$/;
const MUXED_SHAPE = /^M[A-Z2-7]{68}$/;

/**
 * Destination categories recognized by {@link classifySearch}: Stellar
 * account ID, Soroban contract ID, muxed account address, transaction hash,
 * or free-text memo search.
 */
export type SearchKind = "account" | "contract" | "muxed" | "transaction" | "memo";

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
 * M-addresses are additionally verified against their StrKey checksum via the
 * Stellar SDK so a corrupted muxed address is treated as memo text rather than
 * silently routing to a wrong account.
 *
 * Returns `null` for empty input — there is nothing to route, and the caller
 * should leave the user where they are rather than sending them anywhere.
 */
export function classifySearch(raw: string): ClassifiedSearch | null {
  const query = raw.trim();
  if (!query) return null;

  const upper = query.toUpperCase();
  if (ACCOUNT_SHAPE.test(upper)) {
    return { kind: "account", value: upper };
  }
  if (CONTRACT_SHAPE.test(upper)) {
    return { kind: "contract", value: upper };
  }
  if (MUXED_SHAPE.test(upper) && StrKey.isValidMed25519PublicKey(upper)) {
    return { kind: "muxed", value: upper };
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
 * A muxed address routes to the underlying G account page with the full
 * M-address in a `muxed` query parameter so the page can display the muxed ID.
 */
export function searchHref({ kind, value }: ClassifiedSearch): string {
  switch (kind) {
    case "account":
      return `/accounts/${value}`;
    case "contract":
      return `/events?contractId=${value}`;
    case "muxed": {
      const { decodeMuxedAddress } = require("@/lib/stellarAddress");
      const components = decodeMuxedAddress(value) as { baseAccount: string; muxedId: string } | null;
      if (!components) return `/search?q=${encodeURIComponent(value)}`;
      return `/accounts/${components.baseAccount}?muxed=${encodeURIComponent(value)}`;
    }
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
  get account() { return t("searchBar.searchKindAccount"); },
  get contract() { return t("searchBar.searchKindContract"); },
  get muxed() { return t("searchBar.searchKindMuxed"); },
  get transaction() { return t("searchBar.searchKindTransaction"); },
  get memo() { return t("searchBar.searchKindMemo"); },
};
