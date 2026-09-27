// @vitest-environment jsdom
/**
 * Share metadata, per route.
 *
 * The failure this guards against is specific and easy to miss by eye: a route
 * sets `openGraph.title` on its own, Next replaces the parent's `openGraph`
 * wholesale, and the result is a link preview with no `siteName` and no image —
 * which looks fine in the source and renders as a bare text line in Slack.
 *
 * So these assert the resolved card, not the fields that were passed in.
 */
import { describe, expect, it } from "vitest";
import { routeMetadata, shareCard, accountOgImage, OG_IMAGE_SIZE, DEFAULT_OG_IMAGE } from "@/lib/metadata";
import { STABLE_ROUTES } from "@/lib/routes";
import { SITE_NAME, SITE_TITLE } from "@/lib/site";
import { generateMetadata as accountMetadata } from "@/app/accounts/[address]/page";
import { metadata as homeMetadata } from "@/app/page";
import { metadata as explorerMetadata } from "@/app/explorer/page";
import { metadata as eventsMetadata } from "@/app/events/page";
import { metadata as statsMetadata } from "@/app/stats/page";
import { metadata as transactionsMetadata } from "@/app/transactions/page";
import { metadata as graphqlMetadata } from "@/app/graphql/layout";
import { metadata as registryMetadata } from "@/app/registry/layout";

/** The fields a preview client actually reads, in the shape it reads them. */
function cardOf(value: ReturnType<typeof routeMetadata>) {
  const og = value.openGraph as {
    siteName?: string;
    title?: string;
    url?: string;
    images?: { url: string; width?: number; height?: number; alt?: string }[];
  };
  return { ...og, image: og.images?.[0] };
}

const ADDRESS = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS";

describe("every route's share card", () => {
  const cards = [
    { route: "/", metadata: homeMetadata },
    { route: "/explorer", metadata: explorerMetadata },
    { route: "/transactions", metadata: transactionsMetadata },
    { route: "/events", metadata: eventsMetadata },
    { route: "/stats", metadata: statsMetadata },
    { route: "/graphql", metadata: graphqlMetadata },
    { route: "/registry", metadata: registryMetadata },
  ];

  it.each(cards)("$route carries a complete card", ({ route, metadata: value }) => {
    const card = cardOf(value as ReturnType<typeof routeMetadata>);

    // The three fields a client needs and silently drops the preview without.
    expect(card.siteName).toBe(SITE_NAME);
    expect(card.image?.url).toBeTruthy();
    expect(card.title).toBeTruthy();
    expect(value.description).toBeTruthy();
    // And it must be absolute, or the client treats it as a relative path and
    // shows nothing.
    expect(card.image?.url).toMatch(/^\//);
    expect(card.image?.width).toBe(OG_IMAGE_SIZE.width);
    expect(card.image?.height).toBe(OG_IMAGE_SIZE.height);
    expect(card.image?.alt).toBeTruthy();
    expect((value.alternates as { canonical?: string } | undefined)?.canonical).toBe(route);
  });

  it.each(cards)("$route's Twitter card matches its Open Graph card", ({ metadata: value }) => {
    const twitter = value.twitter as { card?: string; images?: { url: string }[]; title?: string };
    const card = cardOf(value as ReturnType<typeof routeMetadata>);

    // summary_large_image, or the client renders the image as a thumbnail beside
    // a link instead of a full-width card.
    expect(twitter.card).toBe("summary_large_image");
    expect(twitter.images?.[0].url).toBe(card.image?.url);
    expect(twitter.title).toBe(card.title);
  });

  it.each(cards)("$route's canonical URL drops any filter it was given", ({ metadata: value }) => {
    // A filtered view is the same page; the canonical link says so.
    expect((value.alternates as { canonical?: string }).canonical).not.toContain("?");
  });
});

describe("routeMetadata", () => {
  it("gives the same card to a route as the inventory describes it", () => {
    // The point of building the card from the route record: a page cannot drift
    // from its own entry in the inventory.
    for (const route of STABLE_ROUTES) {
      const value = routeMetadata(route);
      const card = cardOf(value);

      expect(card.title).toBe(route.label);
      expect(card.url).toBe(route.path);
      expect(value.description).toBe(route.description);
    }
  });

  it("uses a per-entity image when the route has one, and the site card otherwise", () => {
    const plain = cardOf(routeMetadata({ label: "Explorer", description: "d", path: "/explorer" }));
    const perAccount = cardOf(
      routeMetadata({ label: "GA…", description: "d", path: "/accounts/GA", image: "/accounts/GA/opengraph-image" })
    );

    expect(plain.image?.url).toBe(DEFAULT_OG_IMAGE);
    expect(perAccount.image?.url).toBe("/accounts/GA/opengraph-image");
  });

  it("does not repeat the brand in the alt text of the site card", () => {
    // The site card is already titled with the brand, so appending it to the
    // alt text reads "… — Lumina — Lumina".
    const home = cardOf(shareCard({ label: SITE_TITLE, description: "d", path: "/" }) as never);

    expect(home.image?.alt).not.toContain(`${SITE_NAME} — ${SITE_NAME}`);
  });
});

describe("the account page", () => {
  it("titles itself from the address and points at its own image", async () => {
    const value = await accountMetadata({ params: Promise.resolve({ address: ADDRESS }) });
    const card = cardOf(value);

    expect(card.title).toContain(ADDRESS.slice(0, 6));
    expect(card.image?.url).toBe(accountOgImage(ADDRESS));
    expect((value.alternates as { canonical?: string }).canonical).toBe(`/accounts/${ADDRESS}`);
  });

  it("builds its metadata from the address alone, with no API read", async () => {
    // A preview bot follows this link with no session and no patience. If the
    // card waited on the indexer it would arrive blank exactly when the indexer
    // is the thing that is down.
    const value = await accountMetadata({ params: Promise.resolve({ address: "G" }) });

    expect(cardOf(value).title).toBe("G");
    expect(value.description).toContain("G");
  });

  it("encodes an address into the image path rather than interpolating it raw", () => {
    // Addresses are user input; a path segment is not a place to put one
    // unescaped.
    expect(accountOgImage("GA/../b")).toBe("/accounts/GA%2F..%2Fb/opengraph-image");
  });
});
