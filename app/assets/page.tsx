import type { Metadata } from "next";
import {
  AssetsDocument as ASSETS_QUERY,
  type AssetSort,
} from "@/lib/generated/graphql";
import { gqlFetch, GRAPHQL_URL } from "@/lib/graphql";
import {
  DEFAULT_NETWORK,
  graphqlNetwork,
  parseNetwork,
  type NetworkId,
} from "@/lib/network";
import { routeMetadata } from "@/lib/metadata";
import { ASSETS } from "@/lib/routes";
import AssetBrowser, {
  PAGE_SIZE,
  type AssetSummary,
} from "@/components/AssetBrowser";
import BackendUnavailable from "@/components/BackendUnavailable";

export const dynamic = "force-dynamic";

/**
 * `?sort=` is not in the canonical URL: `/assets` and `/assets?sort=VOLUME` are
 * two orderings of one collection, and listing both would have them competing
 * for the same content. The crawl-exclusion rule in lib/routes.ts already keeps
 * query permutations out of the sitemap for the same reason.
 */
export function generateMetadata(): Metadata {
  return routeMetadata(ASSETS);
}

/**
 * Anything that is not literally `VOLUME` is the default ordering, so a stale
 * or hand-edited `?sort=` link still renders a page instead of erroring.
 */
function parseSort(raw: string | undefined): AssetSort {
  return raw?.toUpperCase() === "VOLUME" ? "VOLUME" : "HOLDERS";
}

async function getAssets(
  sort: AssetSort,
  network: NetworkId,
): Promise<{
  items: AssetSummary[];
  cursor: string | null;
  hasNextPage: boolean;
  unavailable: boolean;
}> {
  try {
    // No explicit type arguments: `gqlFetch` infers them from the typed
    // document, so the variables below are checked against the generated
    // `AssetsQueryVariables` instead of a hand-copied shape that could drift.
    const data = await gqlFetch(GRAPHQL_URL, ASSETS_QUERY, {
      sortBy: sort,
      limit: PAGE_SIZE,
      network: graphqlNetwork(network),
    });
    return {
      items: data.assets.items,
      cursor: data.assets.pageInfo.cursor,
      hasNextPage:
        data.assets.pageInfo.hasNextPage &&
        data.assets.pageInfo.cursor !== null,
      unavailable: false,
    };
  } catch {
    return { items: [], cursor: null, hasNextPage: false, unavailable: true };
  }
}

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; network?: string }>;
}) {
  const { sort: rawSort, network: rawNetwork } = await searchParams;
  const sort = parseSort(rawSort);
  // The same rule `readNetwork` applies to a URL: an unknown name is the default.
  const network = parseNetwork(rawNetwork) ?? DEFAULT_NETWORK;
  const first = await getAssets(sort, network);

  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12">
      <h1 className="font-extrabold text-3xl mb-2 text-[var(--color-text-primary)]">
        Assets
      </h1>
      <p className="text-[var(--color-text-secondary)] mb-7">
        Every asset Lumina indexes, with the supply and holder counts behind it.
      </p>

      {first.unavailable ? (
        <BackendUnavailable />
      ) : (
        // Keyed on the network as well as the sort. Switching network re-renders
        // this page with new `initial` rows, but `useState` keeps whatever rows it
        // already holds; without the network in the key, mainnet rows would stay
        // on screen under a testnet selection.
        <AssetBrowser
          key={`${network}:${sort}`}
          initial={first.items}
          initialCursor={first.cursor}
          initialHasNextPage={first.hasNextPage}
          sort={sort}
        />
      )}
    </div>
  );
}
