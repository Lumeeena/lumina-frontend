import OgCard from "./OgCard";
import { DEFAULT_DESCRIPTION } from "@/lib/site";

/**
 * The site's static share card, rendered by an entity's share image when that
 * entity cannot be fetched. It is the same card `app/opengraph-image.tsx`
 * produces, so a failed generation previews exactly like the default.
 */
export default function FallbackOgCard() {
  return (
    <OgCard
      eyebrow="Stellar data layer"
      title="Stellar network data, illuminated."
      subtitle={DEFAULT_DESCRIPTION}
    />
  );
}
