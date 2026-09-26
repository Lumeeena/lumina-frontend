import { ImageResponse } from "next/og";
import OgCard from "@/components/OgCard";
import { OG_IMAGE_SIZE } from "@/lib/metadata";

/**
 * A share card for one account.
 *
 * Deliberately built from the address alone, with no call to the GraphQL API.
 * A card is fetched by Slack, Discord, WhatsApp and every other preview bot
 * with no session and no patience: one that waits on this app's backend is one
 * that arrives blank when the indexer is down, and the address is what actually
 * identifies the account anyway.
 */
export const alt = "A Stellar account on Lumina";

export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default async function AccountOpengraphImage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  const short = address.length > 24 ? `${address.slice(0, 12)}…${address.slice(-8)}` : address;

  return new ImageResponse(
    (
      <OgCard
        eyebrow="Stellar account"
        title={short}
        subtitle="Balances, transactions and live activity, indexed on Lumina."
      />
    ),
    { ...size }
  );
}
