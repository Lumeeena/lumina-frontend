/**
 * The route inventory, in one place.
 *
 * Three things have to agree about which routes exist and which of them are
 * worth a crawler's time: the nav, the sitemap and robots.txt. Listing them
 * separately in each is how they drift — a new page ships, the sitemap does
 * not mention it, and nobody notices for months. So the nav reads its labels
 * from here, the sitemap lists `STABLE_ROUTES`, and `app/robots.test.ts` fails
 * if a route appears in one and not the other.
 */

export interface RouteInfo {
  /** The path as it appears in the URL, e.g. `/explorer`. */
  path: string;
  /** The name shown in the nav and used as the page's title. */
  label: string;
  /** One sentence about the page, used for its meta description and social card. */
  description: string;
}

export const HOME: RouteInfo = {
  path: "/",
  label: "Home",
  description:
    "Lumina indexes Stellar into Postgres and serves it over a typed GraphQL API: ledgers, transactions, operations, accounts and Soroban contract events.",
};

export const EXPLORER: RouteInfo = {
  path: "/explorer",
  label: "Explorer",
  description:
    "Search any Stellar account or browse recent transactions, updated live over a GraphQL subscription.",
};

export const TRANSACTIONS: RouteInfo = {
  path: "/transactions",
  label: "Transactions",
  description:
    "Every indexed Stellar transaction, with filters, saved presets and cursor pagination.",
};

export const SEARCH: RouteInfo = {
  path: "/search",
  label: "Search",
  description:
    "Memo search across every indexed transaction — order references and short codes, ranked by the backend's trigram similarity.",
};

export const EVENTS: RouteInfo = {
  path: "/events",
  label: "Contract Events",
  description:
    "Soroban contract events indexed by Lumina, filterable by contract id.",
};

export const GRAPHQL: RouteInfo = {
  path: "/graphql",
  label: "GraphQL",
  description:
    "Run queries against the Lumina GraphQL API from the browser, with worked examples.",
};

export const REGISTRY: RouteInfo = {
  path: "/registry",
  label: "Registry",
  description:
    "An on-chain Soroban manifest of contracts Lumina indexes — register a contract to opt into indexing.",
};

export const STATS: RouteInfo = {
  path: "/stats",
  label: "Stats",
  description:
    "Indexer health and Stellar network throughput: latest ledger, transaction volume and the mix of operation types.",
};

/**
 * The routes a crawler should be pointed at, in the order the sitemap lists
 * them — most important first, which is also the order Google's docs suggest
 * for a flat list of equally important pages.
 *
 * Deliberately absent: `/accounts/[address]`. It is one page per Stellar
 * address, so the set is unbounded — see `CRAWL_EXCLUDED`.
 */
export const STABLE_ROUTES: readonly RouteInfo[] = [
  HOME,
  EXPLORER,
  TRANSACTIONS,
  SEARCH,
  EVENTS,
  GRAPHQL,
  REGISTRY,
  STATS,
];

/** The nav shows every route except the home page, which the wordmark links to. */
export const NAV_ROUTES: readonly RouteInfo[] = STABLE_ROUTES.filter(
  (route) => route.path !== HOME.path,
);

export interface CrawlExclusion {
  /** A robots.txt path prefix; the trailing `*` is a Google/Bing wildcard. */
  pattern: string;
  /** Why it is excluded, so the rule can be argued with rather than just obeyed. */
  reason: string;
}

/**
 * Paths robots.txt keeps crawlers away from.
 *
 * The reasoning is the same for both: the URL is not a page a person would
 * ever find, and the space they cover is large enough to crowd out the routes
 * that are. A crawler that spends its budget walking account pages never
 * reaches the stats page.
 */
export const CRAWL_EXCLUDED: readonly CrawlExclusion[] = [
  {
    pattern: "/accounts/",
    reason:
      "one page per Stellar address — an unbounded set, and none of them is a route anyone arrives on directly",
  },
  {
    pattern: "/transactions/",
    reason:
      "one page per transaction hash — an unbounded set for the same reason as account pages",
  },
  {
    pattern: "/*?",
    reason:
      "filter and search permutations (?contractId=, ?category=, ?status=, ?q=…) are the same content as the canonical route, so they multiply the URL space without adding anything to crawl",
  },
];
