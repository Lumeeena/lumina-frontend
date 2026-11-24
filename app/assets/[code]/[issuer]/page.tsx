import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BackendUnavailable from "@/components/BackendUnavailable";
import { AreaChart } from "@/components/charts/AreaChart";
import { formatSupply } from "@/lib/formatters";
import { gqlFetch, GRAPHQL_URL } from "@/lib/graphql";
import { truncateAddress } from "@/lib/formatters";
import { routeMetadata } from "@/lib/metadata";
import { SITE_NAME } from "@/lib/site";
import { TypedDocumentString, type Network } from "@/lib/generated/graphql";
import { AssetActions } from "@/components/AssetActions";
import AssetTrustlineFeed, {
  type AssetTrustlineChange,
} from "@/components/AssetTrustlineFeed";
import {
  DEFAULT_NETWORK,
  graphqlNetwork,
  parseNetwork,
  withNetwork,
  type NetworkId,
} from "@/lib/network";
import { getServerTranslator } from "@/lib/i18n/server";

const BUCKET_SECONDS = 86_400;

export const dynamic = "force-dynamic";

type AssetDetailQuery = {
  asset: {
    asset: string;
    code: string | null;
    issuer: string | null;
    native: boolean;
    supply: string;
    holders: number;
    series: Array<{
      bucketStart: string;
      volume: string;
      operationCount: number;
    }>;
  } | null;
};

type AssetDetailQueryVariables = {
  asset: string;
  from?: string | null;
  to?: string | null;
  bucketSeconds?: number | null;
  network?: Network | null;
};

const ASSET_DETAIL_DOCUMENT = new TypedDocumentString(`
  query AssetDetail($asset: String!, $from: String, $to: String, $bucketSeconds: Int, $network: Network) {
    asset(asset: $asset, from: $from, to: $to, bucketSeconds: $bucketSeconds, network: $network) {
      asset
      code
      issuer
      native
      supply
      holders
      series {
        bucketStart
        volume
        operationCount
      }
    }
  }
`) as unknown as TypedDocumentString<
  AssetDetailQuery,
  AssetDetailQueryVariables
>;

type AssetTrustlinesQuery = {
  operations: {
    items: AssetTrustlineChange[];
  };
};

type AssetTrustlinesQueryVariables = {
  asset: string;
  limit?: number | null;
  network?: Network | null;
};

// Trustline history is the `change_trust` operations on one asset. The asset
// aggregate only knows the current holder count, so the operation list is the
// only place a per-account change can come from.
const ASSET_TRUSTLINES_DOCUMENT = new TypedDocumentString(`
  query AssetTrustlines($asset: String!, $limit: Int, $network: Network) {
    operations(asset: $asset, type: CHANGE_TRUST, limit: $limit, network: $network) {
      items {
        id
        createdAt
        transactionHash
        sourceAccount
        amount
      }
    }
  }
`) as unknown as TypedDocumentString<
  AssetTrustlinesQuery,
  AssetTrustlinesQueryVariables
>;

const TRUSTLINE_LIMIT = 10;

function bucketLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function isAllZero(series: Array<{ volume: string }>) {
  return series.every((bucket) => parseFloat(bucket.volume) === 0);
}

function totalVolume(series: Array<{ volume: string }>) {
  return series.reduce(
    (sum, bucket) => sum + parseFloat(bucket.volume || "0"),
    0,
  );
}

export function generateMetadata({
  params,
}: {
  params: Promise<{ code: string; issuer: string }>;
}): Promise<Metadata> {
  return params.then(({ code, issuer }) => {
    const assetCode = decodeURIComponent(code);
    const assetIssuer = decodeURIComponent(issuer);
    const label = assetIssuer
      ? `${assetCode} by ${truncateAddress(assetIssuer, 8)}`
      : assetCode;

    return routeMetadata({
      path: `/assets/${encodeURIComponent(assetCode)}/${encodeURIComponent(assetIssuer)}`,
      label,
      description: `Asset ${assetCode} issued by ${assetIssuer}: current supply, holder count, and transfer volume.`,
      image: `/assets/${encodeURIComponent(assetCode)}/${encodeURIComponent(assetIssuer)}/opengraph-image`,
      imageAlt: `${label} on ${SITE_NAME}`,
    });
  });
}

async function getTrustlineChanges(
  assetKey: string,
  network: NetworkId,
): Promise<{ items: AssetTrustlineChange[]; unavailable: boolean }> {
  try {
    const data = await gqlFetch(GRAPHQL_URL, ASSET_TRUSTLINES_DOCUMENT, {
      asset: assetKey,
      limit: TRUSTLINE_LIMIT,
      network: graphqlNetwork(network),
    });
    return { items: data.operations.items, unavailable: false };
  } catch {
    // The feed failing must not take the asset's supply and volume down with it.
    return { items: [], unavailable: true };
  }
}

async function getAsset(
  code: string,
  issuer: string,
  network: NetworkId,
): Promise<{ asset: AssetDetailQuery["asset"]; unavailable: boolean }> {
  const assetKey = `${code}:${issuer}`;

  try {
    const data = await gqlFetch(GRAPHQL_URL, ASSET_DETAIL_DOCUMENT, {
      asset: assetKey,
      bucketSeconds: BUCKET_SECONDS,
      network: graphqlNetwork(network),
    });
    return { asset: data.asset, unavailable: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      /not found|unknown asset|no asset|asset does not exist/i.test(message)
    ) {
      notFound();
    }
    return { asset: null, unavailable: true };
  }
}

const statCell =
  "bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] rounded-xl p-4";

export default async function AssetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string; issuer: string }>;
  searchParams: Promise<{ network?: string }>;
}) {
  const { code, issuer } = await params;
  const { network: rawNetwork } = await searchParams;
  const { t } = await getServerTranslator();
  const network = parseNetwork(rawNetwork) ?? DEFAULT_NETWORK;
  const decodedCode = decodeURIComponent(code);
  const decodedIssuer = decodeURIComponent(issuer);
  const assetKey = `${decodedCode}:${decodedIssuer}`;
  const [{ asset, unavailable }, trustlines] = await Promise.all([
    getAsset(decodedCode, decodedIssuer, network),
    getTrustlineChanges(assetKey, network),
  ]);

  if (unavailable) {
    return <BackendUnavailable />;
  }

  if (!asset) {
    notFound();
  }

  const series = asset.series;
  const allZero = isAllZero(series);
  const volume = totalVolume(series);
  const assetLabel = asset.code ?? asset.asset;

  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12">
      <Link
        href={withNetwork("/assets", network)}
        className="inline-block text-[13px] font-semibold text-[var(--color-accent-text)] hover:text-[var(--color-accent-text-hover)] mb-[18px]"
      >
        {t("assetDetail.backToAssets")}
      </Link>

      <div className="mb-7">
        <p className="text-[11px] tracking-[0.06em] uppercase text-[var(--color-text-muted)] mb-2">
          {t("assetDetail.eyebrow")}
        </p>
        <div className="flex items-center gap-3 flex-wrap mb-1.5">
          <h1 className="font-extrabold text-3xl text-[var(--color-text-primary)]">
            {assetLabel}
          </h1>
          {asset.issuer && (
            <span className="rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-raised)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-text-secondary)]">
              {asset.native
                ? t("assetDetail.nativeAsset")
                : t("assetDetail.customAsset")}
            </span>
          )}
          <AssetActions asset={asset} />
        </div>
        {asset.issuer ? (
          <p className="mono text-base break-all text-[var(--color-text-secondary)]">
            {asset.issuer}
          </p>
        ) : (
          <p className="text-[var(--color-text-secondary)]">
            {t("assetDetail.nativeStellarAsset")}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className={statCell}>
          <div className="text-[11px] uppercase tracking-[0.05em] text-[var(--color-text-muted)]">
            {t("assetDetail.statSupply")}
          </div>
          <div className="mono text-base font-bold mt-1 text-[var(--color-text-primary)]">
            {formatSupply(asset.supply)}
          </div>
        </div>
        <div className={statCell}>
          <div className="text-[11px] uppercase tracking-[0.05em] text-[var(--color-text-muted)]">
            {t("assetDetail.statHolders")}
          </div>
          <div className="mono text-base font-bold mt-1 text-[var(--color-text-primary)]">
            {asset.holders.toLocaleString()}
          </div>
        </div>
        <div className={statCell}>
          <div className="text-[11px] uppercase tracking-[0.05em] text-[var(--color-text-muted)]">
            {t("assetDetail.stat30dVolume")}
          </div>
          <div className="mono text-base font-bold mt-1 text-[var(--color-text-primary)]">
            {volume.toLocaleString(undefined, {
              maximumFractionDigits: 4,
            })}
          </div>
        </div>
      </div>

      <div
        role="region"
        aria-label={t("assetDetail.detailsAriaLabel")}
        tabIndex={0}
        className="max-w-full rounded-xl border border-[var(--color-border-default)] overflow-x-auto mb-8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-fill)]"
      >
        <table className="w-full min-w-[360px] text-sm border-collapse">
          <tbody>
            <tr className="border-b border-[var(--color-bg-overlay)]">
              <td className="py-2.5 px-3 text-[var(--color-text-muted)] text-xs w-[140px]">
                {t("assetDetail.rowAssetCode")}
              </td>
              <td className="py-2.5 px-3 mono text-xs text-[var(--color-text-primary)]">
                {assetLabel}
              </td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 text-[var(--color-text-muted)] text-xs w-[140px]">
                {t("assetDetail.rowIssuer")}
              </td>
              <td className="py-2.5 px-3 mono text-xs text-[var(--color-text-primary)] break-all">
                {asset.issuer ? (
                  <span title={asset.issuer}>
                    {truncateAddress(asset.issuer, 12)}
                  </span>
                ) : (
                  "\u2014"
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="font-extrabold text-base mb-3 text-[var(--color-text-primary)]">
        {t("assetDetail.transferVolumeHeading")}
      </h2>

      {allZero ? (
        <div
          className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] flex flex-col items-center justify-center gap-2 p-8 text-center"
          style={{ minHeight: 280 }}
        >
          <p className="text-[var(--color-text-secondary)] text-sm font-semibold">
            {t("assetDetail.noActivityTitle")}
          </p>
          <p className="text-[var(--color-text-muted)] text-xs max-w-xs">
            {t("assetDetail.noActivityBody", { asset: assetLabel })}
          </p>
        </div>
      ) : (
        <AreaChart
          title={t("assetDetail.chartTitle", { asset: assetLabel })}
          description={t("assetDetail.chartDescription", { asset: assetLabel })}
          data={series.map((bucket) => ({
            label: bucketLabel(bucket.bucketStart),
            value: parseFloat(bucket.volume),
          }))}
          unit={` ${assetLabel}`}
          caption={t("assetDetail.chartCaption")}
          height={280}
        />
      )}

      <AssetTrustlineFeed
        assetLabel={assetLabel}
        items={trustlines.items}
        unavailable={trustlines.unavailable}
        network={network}
      />
    </div>
  );
}
