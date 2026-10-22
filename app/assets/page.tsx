import type { Metadata } from "next";
import {
  AssetsDocument as ASSETS_QUERY,
  type AssetSort,
} from "@/lib/generated/graphql";
import { gqlFetch, GRAPHQL_URL } from "@/lib/graphql";
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

async function getAssets(sort: AssetSort): Promise<{
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
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort: rawSort } = await searchParams;
  const sort = parseSort(rawSort);
  const first = await getAssets(sort);

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
        // Keyed on the sort so changing it starts a clean list. Without it the
        // component keeps the rows it had under the old ordering and appends the
        // new ordering's page two, which is a list of two different things.
        <AssetBrowser
          key={sort}
          initial={first.items}
          initialCursor={first.cursor}
          initialHasNextPage={first.hasNextPage}
          sort={sort}
        />
      )}
    </div>
  );
}
