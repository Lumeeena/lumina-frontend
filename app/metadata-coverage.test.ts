/**
 * Route metadata coverage tests.
 *
 * Verifies that routes added over time have their own distinct titles and
 * descriptions rather than inheriting the root layout's defaults, which would
 * make browser tabs and link previews read identically.
 *
 * Related GitHub issues: #296, #297, #299, #300
 */
import { describe, expect, it } from "vitest";
import { metadata as homeMetadata } from "@/app/page";
import { metadata as explorerMetadata } from "@/app/explorer/page";
import { metadata as transactionsMetadata } from "@/app/transactions/page";
import { metadata as graphqlMetadata } from "@/app/graphql/layout";
import { SITE_TITLE, DEFAULT_DESCRIPTION } from "@/lib/site";
import { EXPLORER, TRANSACTIONS, GRAPHQL } from "@/lib/routes";

describe("Route metadata coverage", () => {
  describe("Home route (/)", () => {
    it("has a distinct title and description", () => {
      expect(homeMetadata.title).toEqual({ absolute: SITE_TITLE });
      expect(homeMetadata.description).toBe(DEFAULT_DESCRIPTION);
    });

    it("includes share card metadata", () => {
      expect(homeMetadata.openGraph).toBeDefined();
      expect(homeMetadata.openGraph?.title).toBe(SITE_TITLE);
      expect(homeMetadata.openGraph?.description).toBe(DEFAULT_DESCRIPTION);
      expect(homeMetadata.openGraph?.url).toBe("/");

      expect(homeMetadata.twitter).toBeDefined();
      expect(homeMetadata.twitter?.card).toBe("summary_large_image");
      expect(homeMetadata.twitter?.title).toBe(SITE_TITLE);
      expect(homeMetadata.twitter?.description).toBe(DEFAULT_DESCRIPTION);
    });

    it("includes canonical URL", () => {
      expect(homeMetadata.alternates?.canonical).toBe("/");
    });
  });

  describe("Explorer route (/explorer)", () => {
    it("has a distinct title and description", () => {
      expect(explorerMetadata.title).toBe(EXPLORER.label);
      expect(explorerMetadata.title).not.toBe(SITE_TITLE);
      expect(explorerMetadata.description).toBe(EXPLORER.description);
      expect(explorerMetadata.description).not.toBe(DEFAULT_DESCRIPTION);
    });

    it("includes share card metadata", () => {
      expect(explorerMetadata.openGraph).toBeDefined();
      expect(explorerMetadata.openGraph?.title).toBe(EXPLORER.label);
      expect(explorerMetadata.openGraph?.description).toBe(
        EXPLORER.description,
      );
      expect(explorerMetadata.openGraph?.url).toBe(EXPLORER.path);

      expect(explorerMetadata.twitter).toBeDefined();
      expect(explorerMetadata.twitter?.card).toBe("summary_large_image");
      expect(explorerMetadata.twitter?.title).toBe(EXPLORER.label);
      expect(explorerMetadata.twitter?.description).toBe(EXPLORER.description);
    });

    it("includes canonical URL", () => {
      expect(explorerMetadata.alternates?.canonical).toBe(EXPLORER.path);
    });
  });

  describe("Transactions route (/transactions)", () => {
    it("has a distinct title and description", () => {
      expect(transactionsMetadata.title).toBe(TRANSACTIONS.label);
      expect(transactionsMetadata.title).not.toBe(SITE_TITLE);
      expect(transactionsMetadata.description).toBe(TRANSACTIONS.description);
      expect(transactionsMetadata.description).not.toBe(DEFAULT_DESCRIPTION);
    });

    it("includes share card metadata", () => {
      expect(transactionsMetadata.openGraph).toBeDefined();
      expect(transactionsMetadata.openGraph?.title).toBe(TRANSACTIONS.label);
      expect(transactionsMetadata.openGraph?.description).toBe(
        TRANSACTIONS.description,
      );
      expect(transactionsMetadata.openGraph?.url).toBe(TRANSACTIONS.path);

      expect(transactionsMetadata.twitter).toBeDefined();
      expect(transactionsMetadata.twitter?.card).toBe("summary_large_image");
      expect(transactionsMetadata.twitter?.title).toBe(TRANSACTIONS.label);
      expect(transactionsMetadata.twitter?.description).toBe(
        TRANSACTIONS.description,
      );
    });

    it("includes canonical URL", () => {
      expect(transactionsMetadata.alternates?.canonical).toBe(
        TRANSACTIONS.path,
      );
    });
  });

  describe("GraphQL route (/graphql)", () => {
    it("has a distinct title and description", () => {
      expect(graphqlMetadata.title).toBe(GRAPHQL.label);
      expect(graphqlMetadata.title).not.toBe(SITE_TITLE);
      expect(graphqlMetadata.description).toBe(GRAPHQL.description);
      expect(graphqlMetadata.description).not.toBe(DEFAULT_DESCRIPTION);
    });

    it("includes share card metadata", () => {
      expect(graphqlMetadata.openGraph).toBeDefined();
      expect(graphqlMetadata.openGraph?.title).toBe(GRAPHQL.label);
      expect(graphqlMetadata.openGraph?.description).toBe(GRAPHQL.description);
      expect(graphqlMetadata.openGraph?.url).toBe(GRAPHQL.path);

      expect(graphqlMetadata.twitter).toBeDefined();
      expect(graphqlMetadata.twitter?.card).toBe("summary_large_image");
      expect(graphqlMetadata.twitter?.title).toBe(GRAPHQL.label);
      expect(graphqlMetadata.twitter?.description).toBe(GRAPHQL.description);
    });

    it("includes canonical URL", () => {
      expect(graphqlMetadata.alternates?.canonical).toBe(GRAPHQL.path);
    });
  });

  describe("Metadata uniqueness", () => {
    it("each route has a unique title", () => {
      const titles = [
        homeMetadata.title,
        explorerMetadata.title,
        transactionsMetadata.title,
        graphqlMetadata.title,
      ];

      const uniqueTitles = new Set(
        titles.map((t) => (typeof t === "string" ? t : JSON.stringify(t))),
      );
      expect(uniqueTitles.size).toBe(titles.length);
    });

    it("each route has a unique description", () => {
      const descriptions = [
        homeMetadata.description,
        explorerMetadata.description,
        transactionsMetadata.description,
        graphqlMetadata.description,
      ];

      const uniqueDescriptions = new Set(descriptions);
      expect(uniqueDescriptions.size).toBe(descriptions.length);
    });
  });
});
