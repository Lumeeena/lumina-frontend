import { ImageResponse } from "next/og";
import OgCard from "@/components/OgCard";
import { DEFAULT_OG_IMAGE_ALT, OG_IMAGE_SIZE } from "@/lib/metadata";
import { DEFAULT_DESCRIPTION } from "@/lib/site";

/**
 * The default share card, generated at build time — a static image with no
 * request-time data in it, so a crawler that follows `og:image` gets a response
 * immediately rather than waiting on this app's own backend.
 */
export const alt = DEFAULT_OG_IMAGE_ALT;
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <OgCard
        eyebrow="Stellar data layer"
        title="Stellar network data, illuminated."
        subtitle={DEFAULT_DESCRIPTION}
      />
    ),
    { ...size }
  );
}
