import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BackendUnavailable from "@/components/BackendUnavailable";
import { AreaChart } from "@/components/charts/AreaChart";
import { formatSupply } from "@/components/AssetBrowser";
import { gqlFetch, GRAPHQL_URL } from "@/lib/graphql";
import { truncateAddress } from "@/lib/formatters";
import { routeMetadata } from "@/lib/metadata";
import type { TypedDocumentString } from "@/lib/generated/graphql";

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
};

const ASSET_DETAIL_DOCUMENT = new TypedDocumentString(`
  query AssetDetail($asset: String!, $from: String, $to: String, $bucketSeconds: Int) {
    asset(asset: $asset, from: $from, to: $to, bucketSeconds: $bucketSeconds) {
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
`) as unknown as TypedDocumentString<AssetDetailQuery, AssetDetailQueryVariables>;

function bucketLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function isAllZero(series: Array<{ volume: string }>) {
  return series.every((bucket) => parseFloat(bucket.volume) === 0);
}

function totalVolume(series: Array<{ volume: string }>) {
  return series.reduce((sum, bucket) => sum + parseFloat(bucket.volume || "0"), 0);
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
    });
  });
}

async function getAsset(
  code: string,
  issuer: string,
): Promise<{ asset: AssetDetailQuery["asset"]; unavailable: boolean }> {
  const assetKey = `${code}:${issuer}`;

  try {
    const data = await gqlFetch(GRAPHQL_URL, ASSET_DETAIL_DOCUMENT, {
      asset: assetKey,
      bucketSeconds: BUCKET_SECONDS,
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
}: {
  params: Promise<{ code: string; issuer: string }>;
}) {
  const { code, issuer } = await params;
  const decodedCode = decodeURIComponent(code);
  const decodedIssuer = decodeURIComponent(issuer);
  const { asset, unavailable } = await getAsset(decodedCode, decodedIssuer);

  if (unavailable) {
    return <BackendUnavailable />;
  }

  if (!asset) {
    notFound();
  }

  const series = asset.series;
  const allZero = isAllZero(series);
  const volume = totalVolume(series);

  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12">
      <Link
        href="/assets"
        className="inline-block text-[13px] font-semibold text-[var(--color-accent-text)] hover:text-[var(--color-accent-text-hover)] mb-[18px]"
      >
        &larr; Back to Assets
      </Link>

      <div className="mb-7">
        <p className="text-[11px] tracking-[0.06em] uppercase text-[var(--color-text-muted)] mb-2">
          Asset
        </p>
        <div className="flex items-center gap-3 flex-wrap mb-1.5">
          <h1 className="font-extrabold text-3xl text-[var(--color-text-primary)]">
            {asset.code ?? asset.asset}
          </h1>
          {asset.issuer && (
            <span className="rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-raised)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-text-secondary)]">
              {asset.native ? "Native asset" : "Custom asset"}
            </span>
          )}
        </div>
        {asset.issuer ? (
          <p className="mono text-base break-all text-[var(--color-text-secondary)]">
            {asset.issuer}
          </p>
        ) : (
          <p className="text-[var(--color-text-secondary)]">Native Stellar asset</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className={statCell}>
          <div className="text-[11px] uppercase tracking-[0.05em] text-[var(--color-text-muted)]">
            Supply
          </div>
          <div className="mono text-base font-bold mt-1 text-[var(--color-text-primary)]">
            {formatSupply(asset.supply)}
          </div>
        </div>
        <div className={statCell}>
          <div className="text-[11px] uppercase tracking-[0.05em] text-[var(--color-text-muted)]">
            Holders
          </div>
          <div className="mono text-base font-bold mt-1 text-[var(--color-text-primary)]">
            {asset.holders.toLocaleString()}
          </div>
        </div>
        <div className={statCell}>
          <div className="text-[11px] uppercase tracking-[0.05em] text-[var(--color-text-muted)]">
            30d Volume
          </div>
          <div className="mono text-base font-bold mt-1 text-[var(--color-text-primary)]">
            {volume.toLocaleString(undefined, {
              maximumFractionDigits: 4,
            })}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border-default)] overflow-hidden mb-8">
        <table className="w-full text-sm border-collapse">
          <tbody>
            <tr className="border-b border-[var(--color-bg-overlay)]">
              <td className="py-2.5 px-3 text-[var(--color-text-muted)] text-xs w-[140px]">
                Asset code
              </td>
              <td className="py-2.5 px-3 mono text-xs text-[var(--color-text-primary)]">
                {asset.code ?? asset.asset}
              </td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 text-[var(--color-text-muted)] text-xs w-[140px]">
                Issuer
              </td>
              <td className="py-2.5 px-3 mono text-xs text-[var(--color-text-primary)] break-all">
                {asset.issuer ? (
                  <span title={asset.issuer}>{truncateAddress(asset.issuer, 12)}</span>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="font-extrabold text-base mb-3 text-[var(--color-text-primary)]">
        Transfer Volume
      </h2>

      {allZero ? (
        <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] flex flex-col items-center justify-center gap-2 p-8 text-center" style={{ minHeight: 280 }}>
          <p className="text-[var(--color-text-secondary)] text-sm font-semibold">
            No activity in the last 30 days
          </p>
          <p className="text-[var(--color-text-muted)] text-xs max-w-xs">
            Transfer volume for {asset.code ?? asset.asset} will appear here once
            this asset is sent or received.
          </p>
        </div>
      ) : (
        <AreaChart
          title={`${asset.code ?? asset.asset} transfer volume`}
          description={`Daily transfer volume for ${asset.code ?? asset.asset} over the last 30 days.`}
          data={series.map((bucket) => ({
            label: bucketLabel(bucket.bucketStart),
            value: parseFloat(bucket.volume),
          }))}
          unit={` ${asset.code ?? asset.asset}`}
          caption="Transfer volume (sent + received) per day · last 30 days · daily buckets"
          height={280}
        />
      )}
    </div>
  );
}
