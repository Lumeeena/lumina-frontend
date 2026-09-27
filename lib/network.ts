/**
 * The Stellar networks this app can talk about, and the one place the shape
 * that selects between them is defined.
 *
 * ## The shape is a query parameter
 *
 * `?network=testnet`, not a path segment:
 *
 * - Every route already has a canonical path, and `lib/routes.ts` hands that
 *   path to the nav, the sitemap and the metadata builders. A path segment
 *   would move all eight routes under `/testnet/…`, which changes every
 *   canonical URL, every `og:url` and every crawl rule in order to encode
 *   something that is not a location — the same page, filtered to a different
 *   network. The page is still `/explorer` on testnet.
 * - `app/robots.ts` already treats `/*?` as "the same content as the
 *   canonical route", so a query parameter needs no new crawl rule.
 * - The query survives a static export, a redirect in the middle of a
 *   deployment, and a link a person pastes into a chat client, which is the
 *   whole point of the issue this implements.
 *
 * ## The parameter is written only when it says something
 *
 * `mainnet` is the default, and a link on the default network carries no
 * parameter at all: `/explorer`, not `/explorer?network=mainnet`. That keeps
 * every existing URL exactly as it is, and it keeps `?network=mainnet` from
 * becoming a second spelling of `/`. `withNetwork` is the single place that
 * rule lives, so a link that omits the parameter and a link that writes it
 * cannot disagree.
 *
 * Kept dependency-free, like `lib/site.ts`: the nav, the switcher and the
 * tests all read it, and none of them should have to pull in a Stellar SDK to
 * find out what a network is called.
 */

/** The query parameter that carries the selected network. */
export const NETWORK_PARAM = "network";

export type NetworkId = "mainnet" | "testnet" | "futurenet";

export interface NetworkInfo {
  id: NetworkId;
  /** Shown in the switcher and used as the network's accessible name. */
  label: string;
  /**
   * The passphrase wallets sign with and transaction hashes are derived from —
   * the value `NEXT_PUBLIC_NETWORK_PASSPHRASE` holds for a deployment of this
   * network (see `docs/ENVIRONMENT_VARIABLES.md`). Kept here so the three ids
   * mean something concrete rather than being an opaque string union.
   */
  passphrase: string;
}

/**
 * Every network the switcher offers, in the order it offers them. The three
 * passphrases are Stellar's own constants, matching the ones in
 * `@stellar/stellar-sdk`'s `Networks`.
 */
export const NETWORKS: readonly NetworkInfo[] = [
  {
    id: "mainnet",
    label: "Mainnet",
    passphrase: "Public Global Stellar Network ; September 2015",
  },
  {
    id: "testnet",
    label: "Testnet",
    passphrase: "Test SDF Network ; September 2015",
  },
  {
    id: "futurenet",
    label: "Futurenet",
    passphrase: "Test SDF Future Network ; October 2022",
  },
];

/**
 * The network a URL says nothing about. The indexer data every page shows
 * today is mainnet, so that is what an unparameterised link has always meant;
 * naming it here keeps that meaning from drifting silently.
 */
export const DEFAULT_NETWORK: NetworkId = "mainnet";

/** The ids, for iteration and validation. */
export const NETWORK_IDS: readonly NetworkId[] = NETWORKS.map(
  (network) => network.id,
);

/** Is this exactly one of our network ids? */
export function isNetworkId(value: unknown): value is NetworkId {
  return (
    typeof value === "string" &&
    NETWORKS.some((network) => network.id === value)
  );
}

/**
 * The network a raw parameter value names, or `null` if it names none.
 *
 * Case and surrounding whitespace are ignored, because the value comes from a
 * URL a person may have typed or a chat client may have re-wrapped. An
 * unrecognised value is `null` rather than the default: the caller decides
 * whether an unknown network is "no selection" or an error worth correcting,
 * and `readNetwork` is the one that treats it as the former.
 */
export function parseNetwork(value: string | null | undefined): NetworkId | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return isNetworkId(normalized) ? normalized : null;
}

/**
 * The selected network, resolved from a search string.
 *
 * Accepts what `useSearchParams().toString()` and `window.location.search`
 * produce, with or without the leading `?`, and a `URLSearchParams` directly.
 * A missing or unrecognised value resolves to `DEFAULT_NETWORK` — a link that
 * names a network we do not know is not a link that should fail to render.
 */
export function readNetwork(
  search: string | URLSearchParams | null | undefined,
): NetworkId {
  const value =
    typeof search === "string"
      ? new URLSearchParams(search).get(NETWORK_PARAM)
      : search?.get(NETWORK_PARAM);
  return parseNetwork(value) ?? DEFAULT_NETWORK;
}

/**
 * Is this href one of ours, i.e. one we may add a parameter to?
 *
 * Only same-origin paths qualify. `//host/path` is protocol-relative and
 * leaves this origin, and so does anything with a scheme — rewriting either
 * would either point the parameter at someone else's server or break the URL.
 */
export function isInternalHref(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//");
}

/**
 * `href` with the network it should carry.
 *
 * Preserves the path, every other query parameter and the fragment; replaces
 * an existing `network` rather than adding a second one; and drops the
 * parameter entirely for `DEFAULT_NETWORK`, which is what keeps canonical URLs
 * canonical. Hrefs that are not ours are returned untouched.
 */
export function withNetwork(href: string, network: NetworkId): string {
  if (!isInternalHref(href)) return href;

  // Split by hand rather than through `URL`: the href is a path, not an
  // absolute URL, and `new URL("/explorer")` has nothing to resolve against.
  const hashAt = href.indexOf("#");
  const hash = hashAt === -1 ? "" : href.slice(hashAt);
  const pathAndQuery = hashAt === -1 ? href : href.slice(0, hashAt);
  const queryAt = pathAndQuery.indexOf("?");
  const path = queryAt === -1 ? pathAndQuery : pathAndQuery.slice(0, queryAt);
  const query = queryAt === -1 ? "" : pathAndQuery.slice(queryAt + 1);

  const params = new URLSearchParams(query);
  if (network === DEFAULT_NETWORK) {
    params.delete(NETWORK_PARAM);
  } else {
    params.set(NETWORK_PARAM, network);
  }

  const nextQuery = params.toString();
  return `${path}${nextQuery ? `?${nextQuery}` : ""}${hash}`;
}
