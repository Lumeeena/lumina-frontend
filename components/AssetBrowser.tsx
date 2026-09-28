"use client";

/**
 * The assets browser (#52).
 *
 * A cursor-paginated list of the assets Lumina indexes, ordered by holder count
 * or by transfer volume. Two pieces of state drive it:
 *
 * - **Sort** lives in the URL, because it is a different ordering of the same
 *   collection: a pasted `?sort=VOLUME` link and the back button have to land
 *   on the view the reader was on. The server component re-renders per sort and
 *   passes `key={sort}` here, so a sort change starts from a clean list rather
 *   than leaving rows from the previous ordering underneath the new one.
 * - **Search** deliberately does *not* live in the URL. It filters the rows
 *   loaded so far — the backend's `assets` query takes no search argument yet
 *   (lumina-backend#74) — so it is a local way to find something in a list you
 *   are already looking at, not a distinct view worth a URL. When the backend
 *   grows a search argument this moves server-side and the URL with it.
 *
 * Paging is keyset/cursor, not offset, so new assets landing mid-scroll cannot
 * make the list skip or repeat a row the way an offset would.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AssetsDocument as ASSETS_QUERY,
  type AssetSort,
  type AssetsQuery,
} from "@/lib/generated/graphql";
import { gqlFetch, PUBLIC_GRAPHQL_URL } from "@/lib/graphql";
import { Button } from "@/components/ui/Button";
import LoadMoreFooter from "./LoadMoreFooter";
import BackendUnavailable from "./BackendUnavailable";
import { t } from "@/lib/i18n";

export const PAGE_SIZE = 20;

/**
 * The fields one row needs, read off the generated query rather than restated.
 *
 * `AssetDetail` also carries `series`, the per-asset volume breakdown. This
 * Pick is over the *query result* instead, so `series` is not merely unused — it
 * is not fetched at all. Asking for fifty of them in a list would be fifty
 * aggregations for a column the table does not have; `asset(...)` returns the
 * series for one asset at a time.
 */
export type AssetSummary = AssetsQuery["assets"]["items"][number];

const SORTS: readonly { value: AssetSort; label: string }[] = [
  { value: "HOLDERS", label: "Holders" },
  { value: "VOLUME", label: "Volume" },
];

const th =
  "text-left text-[11px] tracking-[0.06em] uppercase text-[var(--color-text-muted)] px-3 py-2.5 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]";

/**
 * Group a decimal string's integer part without going through a float.
 *
 * `supply` arrives as a string precisely because it does not survive one — a
 * token with a large supply and 7 decimals loses digits to `parseFloat`, and
 * the last digits of someone's balance is not a rounding difference. So the
 * digits are grouped as characters and only the fractional tail is trimmed.
 */
export function formatSupply(supply: string): string {
  const [whole = "0", frac] = supply.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const trimmed = frac?.replace(/0+$/, "") ?? "";
  return trimmed ? `${grouped}.${trimmed}` : grouped;
}

function assetLabel(asset: AssetSummary): string {
  return asset.native ? (asset.code ?? "XLM") : (asset.code ?? asset.asset);
}

export default function AssetBrowser({
  initial,
  initialCursor,
  initialHasNextPage,
  sort,
}: {
  initial: AssetSummary[];
  initialCursor: string | null;
  initialHasNextPage: boolean;
  sort: AssetSort;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [rows, setRows] = useState<AssetSummary[]>(initial);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasNextPage, setHasNextPage] = useState(initialHasNextPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // The rows already rendered, by `CODE:ISSUER`. A cursor page can overlap the
  // previous one when assets are indexed between requests, and a duplicate key
  // is a React error rather than a cosmetic glitch.
  const loaded = useRef(new Set<string>(initial.map((a) => a.asset)));

  const loadMore = useCallback(() => {
    if (loading || !cursor) return;
    setLoading(true);
    setError(null);

    void gqlFetch(PUBLIC_GRAPHQL_URL, ASSETS_QUERY, {
      sortBy: sort,
      limit: PAGE_SIZE,
      cursor,
    })
      .then((data) => {
        const page = data.assets;
        setRows((current) => {
          const seen = loaded.current;
          const fresh = page.items.filter((a) => !seen.has(a.asset));
          for (const asset of fresh) seen.add(asset.asset);
          return current.concat(fresh);
        });
        setCursor(page.pageInfo.cursor);
        setHasNextPage(
          page.pageInfo.hasNextPage && page.pageInfo.cursor !== null,
        );
      })
      .catch(() => {
        setError(t("assets.couldNotLoad"));
        // Stop the footer from re-firing on its own; the explicit retry button
        // puts the reader back in control.
        setHasNextPage(false);
      })
      .finally(() => setLoading(false));
  }, [cursor, loading, sort]);

  const setSort = useCallback(
    (next: AssetSort) => {
      if (next === sort) return;
      router.replace(`${pathname}?sort=${next}`, { scroll: false });
    },
    [pathname, router, sort],
  );

  const needle = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      needle
        ? rows.filter(
            (a) =>
              a.asset.toLowerCase().includes(needle) ||
              (a.code ?? "").toLowerCase().includes(needle) ||
              (a.issuer ?? "").toLowerCase().includes(needle),
          )
        : rows,
    [needle, rows],
  );

  // An empty result under an active search usually means "not loaded yet", not
  // "no such asset" — the next page may well hold it. Saying so beats a bare
  // "no results" that reads as a verdict on the whole collection.
  const searchingNarrowerThanLoaded =
    needle !== "" && visible.length === 0 && rows.length > 0 && hasNextPage;

  if (initial.length === 0 && rows.length === 0 && !error && !hasNextPage) {
    return (
      <div className="rounded-xl border border-[var(--color-border-default)] p-8 text-center text-[var(--color-text-muted)] text-sm">
        {t("assets.noAssetsYet")}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <label className="flex-1 min-w-[220px]">
          <span className="sr-only">
            {t("assets.searchPlaceholder")}
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("assets.searchPlaceholder")}
            className="w-full min-h-[46px] px-3.5 py-2.5 text-[13px] mono bg-[var(--color-bg-raised)] border border-[var(--color-border-default)] rounded-[9px] text-[var(--color-text-primary)]"
          />
        </label>

        <div
          role="group"
          aria-label="Order assets by"
          className="flex items-center gap-2"
        >
          <span className="text-[13px] text-[var(--color-text-secondary)]">
            {t("assets.orderBy")}
          </span>
          {SORTS.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={option.value === sort ? "primary" : "secondary"}
              aria-pressed={option.value === sort}
              onClick={() => setSort(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border-default)] overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className={th}>{t("assets.thAsset")}</th>
              <th className={th}>{t("assets.thIssuer")}</th>
              <th className={`${th} text-right`}>{t("assets.thSupply")}</th>
              <th className={`${th} text-right`}>{t("assets.thHolders")}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((asset) => (
              <tr
                key={asset.asset}
                className="border-b border-[var(--color-border-default)] last:border-0"
              >
                <td className="py-2.5 px-3 mono text-xs text-[var(--color-text-primary)]">
                  {assetLabel(asset)}
                </td>
                <td className="py-2.5 px-3 mono text-xs text-[var(--color-text-secondary)] max-w-[280px] truncate">
                  {asset.issuer ?? "—"}
                </td>
                <td className="py-2.5 px-3 mono text-xs text-[var(--color-text-secondary)] text-right">
                  {formatSupply(asset.supply)}
                </td>
                <td className="py-2.5 px-3 mono text-xs text-[var(--color-text-secondary)] text-right">
                  {asset.holders.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {visible.length === 0 && (
          <p className="p-8 text-center text-[var(--color-text-muted)] text-sm">
            {t("assets.noMatch", { query: query.trim() })}
          </p>
        )}
      </div>

      {searchingNarrowerThanLoaded && (
        <p className="mt-3 text-[13px] text-[var(--color-text-muted)]">
          {t("assets.searchCoversLoaded", {
            count: rows.length,
            noun: rows.length === 1 ? "asset" : "assets",
          })}
        </p>
      )}

      {error ? (
        <div className="mt-4">
          <BackendUnavailable onRetry={loadMore} />
        </div>
      ) : (
        <LoadMoreFooter
          loading={loading}
          error={null}
          hasMore={hasNextPage}
          endLabel={t("assets.endOfAssets")}
          onLoadMore={loadMore}
        />
      )}
    </div>
  );
}
