import { ImageResponse } from "next/og";
import FallbackOgCard from "@/components/FallbackOgCard";
import OgCard from "@/components/OgCard";
import { GRAPHQL_URL, gqlFetch } from "@/lib/graphql";
import { formatXLM, truncateAddress } from "@/lib/formatters";
import { OG_IMAGE_SIZE } from "@/lib/metadata";
import { TransactionDetailDocument as TRANSACTION_QUERY } from "@/lib/generated/graphql";

/**
 * A share card for one transaction: its outcome, operation count and fee.
 *
 * Fetched from GraphQL, unlike the account card, because a transaction has
 * nothing to show without its data. If that read fails the card is the site's
 * static one, so a preview is never blank. Cached for an hour: a transaction
 * is immutable once it is in a ledger, so the image cannot go stale.
 */
export const alt = "A Stellar transaction on Lumina";
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";
export const revalidate = 3600;

export default async function TransactionOpengraphImage({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  const { hash } = await params;

  try {
    const data = await gqlFetch(GRAPHQL_URL, TRANSACTION_QUERY, { hash });
    const transaction = data.transaction;
    if (!transaction) {
      return new ImageResponse(<FallbackOgCard />, { ...size });
    }

    const outcome = transaction.successful ? "Successful" : "Failed";
    const operations = `${transaction.operationCount} ${transaction.operationCount === 1 ? "operation" : "operations"}`;
    const fee = formatXLM((parseInt(transaction.feeCharged) / 1e7).toFixed(7));

    return new ImageResponse(
      (
        <OgCard
          eyebrow="Stellar transaction"
          title={truncateAddress(hash, 6)}
          subtitle={`${outcome} · ${operations} · fee ${fee} XLM`}
        />
      ),
      { ...size }
    );
  } catch {
    return new ImageResponse(<FallbackOgCard />, { ...size });
  }
}
