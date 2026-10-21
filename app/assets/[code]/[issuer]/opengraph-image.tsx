import { ImageResponse } from "next/og";
import FallbackOgCard from "@/components/FallbackOgCard";
import OgCard from "@/components/OgCard";
import { GRAPHQL_URL, gqlFetch } from "@/lib/graphql";
import { truncateAddress } from "@/lib/formatters";
import { OG_IMAGE_SIZE } from "@/lib/metadata";
import { TypedDocumentString } from "@/lib/generated/graphql";

/**
 * A share card for one asset: its supply and holder count.
 *
 * Fetched from GraphQL, and falls back to the site's static card when the read
 * fails. Cached for an hour, since supply and holders move slowly enough that a
 * card an hour old is still accurate.
 *
 * The query is repeated here rather than shared, because the asset page keeps
 * its document private and this route needs only a few of its fields.
 */
const ASSET_SHARE_QUERY = new TypedDocumentString<
  {
    asset: {
      code: string | null;
      native: boolean;
      supply: string;
      holders: number;
    } | null;
  },
  { asset: string }
>(`
  query AssetShare($asset: String!) {
    asset(asset: $asset) {
      code
      native
      supply
      holders
    }
  }
`);

export const alt = "A Stellar asset on Lumina";
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";
export const revalidate = 3600;

export default async function AssetOpengraphImage({
  params,
}: {
  params: Promise<{ code: string; issuer: string }>;
}) {
  const { code, issuer } = await params;
  const assetCode = decodeURIComponent(code);
  const assetIssuer = decodeURIComponent(issuer);

  try {
    const data = await gqlFetch(GRAPHQL_URL, ASSET_SHARE_QUERY, {
      asset: `${assetCode}:${assetIssuer}`,
    });
    const asset = data.asset;
    if (!asset) {
      return new ImageResponse(<FallbackOgCard />, { ...size });
    }

    const name = asset.native ? "XLM" : assetCode;
    const supply = Number(asset.supply).toLocaleString("en-US", { maximumFractionDigits: 2 });
    const holders = `${asset.holders.toLocaleString("en-US")} ${asset.holders === 1 ? "holder" : "holders"}`;

    return new ImageResponse(
      (
        <OgCard
          eyebrow={`Stellar asset · issued by ${truncateAddress(assetIssuer, 6)}`}
          title={name}
          subtitle={`Supply ${supply} · ${holders}`}
        />
      ),
      { ...size }
    );
  } catch {
    return new ImageResponse(<FallbackOgCard />, { ...size });
  }
}
