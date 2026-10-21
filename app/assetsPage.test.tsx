// @vitest-environment jsdom
/**
 * The assets page (#52): the server-rendered first page, and the client list
 * that pages and sorts it.
 *
 * The pieces worth guarding here are the ones a reader would notice going
 * wrong: a cursor page repeating a row, a search that silently looks like "no
 * such asset", and a supply that loses its last digits to a float. The
 * formatting test is deliberately a supply no float could represent, because
 * that is the whole reason `supply` crosses the wire as a string.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const gqlFetch = vi.hoisted(() => vi.fn());
const nav = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: nav.replace, refresh: nav.refresh }),
  usePathname: () => "/assets",
}));

vi.mock("@/lib/graphql", () => ({
  gqlFetch,
  GRAPHQL_URL: "http://test/graphql",
  PUBLIC_GRAPHQL_URL: "http://test/graphql",
}));

import AssetsPage from "./assets/page";
import { formatSupply } from "@/lib/formatters";

const XLM = {
  asset: "XLM",
  code: "XLM",
  issuer: null,
  native: true,
  supply: "100000000000.0000000",
  holders: 4321,
};

const USDC = {
  asset: "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
  code: "USDC",
  issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
  native: false,
  supply: "50000.25",
  holders: 120,
};

function page(
  items: unknown[],
  pageInfo: { hasNextPage: boolean; cursor: string | null } = {
    hasNextPage: false,
    cursor: null,
  },
) {
  return { assets: { items, pageInfo } };
}

/** Render an async server component. */
async function renderPage(sort?: string) {
  return render(
    await AssetsPage({ searchParams: Promise.resolve(sort ? { sort } : {}) }),
  );
}

describe("assets page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the assets the server seeded, with holders grouped", async () => {
    gqlFetch.mockResolvedValue(page([XLM, USDC]));

    await renderPage();

    expect(await screen.findByText("XLM")).toBeDefined();
    expect(screen.getByText("USDC")).toBeDefined();
    // 4,321 — the same grouping the rest of the app does, so a locale with a
    // different separator does not fail the assertion spuriously.
    expect(screen.getByText((4321).toLocaleString())).toBeDefined();
  });

  it("asks the backend for the ordering the URL asked for", async () => {
    gqlFetch.mockResolvedValue(page([XLM]));

    await renderPage("VOLUME");

    await screen.findByText("XLM");
    expect(gqlFetch).toHaveBeenCalledWith(
      "http://test/graphql",
      expect.anything(),
      expect.objectContaining({ sortBy: "VOLUME" }),
    );
  });

  it("falls back to the default ordering for an unknown sort", async () => {
    gqlFetch.mockResolvedValue(page([XLM]));

    await renderPage("holders-but-sideways");

    await screen.findByText("XLM");
    expect(gqlFetch).toHaveBeenCalledWith(
      "http://test/graphql",
      expect.anything(),
      expect.objectContaining({ sortBy: "HOLDERS" }),
    );
  });

  it("appends the next cursor page on Load more", async () => {
    gqlFetch.mockResolvedValueOnce(
      page([XLM], { hasNextPage: true, cursor: "after-usdc" }),
    );
    await renderPage();
    await screen.findByText("XLM");

    gqlFetch.mockResolvedValueOnce(page([USDC]));
    await userEvent.click(await screen.findByText("Load more"));

    await waitFor(() => expect(screen.getByText("USDC")).toBeDefined());
    expect(gqlFetch).toHaveBeenLastCalledWith(
      "http://test/graphql",
      expect.anything(),
      expect.objectContaining({ cursor: "after-usdc" }),
    );
    // The end-of-list label replaces the button, so there is no second click
    // waiting on a page that is already finished.
    expect(screen.getByText("End of assets")).toBeDefined();
  });

  it("drops a row a later page repeats, rather than rendering it twice", async () => {
    gqlFetch.mockResolvedValueOnce(
      page([XLM], { hasNextPage: true, cursor: "c2" }),
    );
    await renderPage();
    await screen.findByText("XLM");

    // A page can overlap the previous one when an asset is indexed between
    // requests; a duplicate React key would take the whole table down.
    gqlFetch.mockResolvedValueOnce(page([XLM, USDC]));
    await userEvent.click(await screen.findByText("Load more"));

    await waitFor(() => expect(screen.getByText("USDC")).toBeDefined());
    expect(screen.getAllByText("XLM")).toHaveLength(1);
  });

  it("rewrites the URL when the ordering changes, so the view is linkable", async () => {
    gqlFetch.mockResolvedValue(page([XLM]));
    await renderPage();
    await screen.findByText("XLM");

    await userEvent.click(screen.getByText("Volume"));

    expect(nav.replace).toHaveBeenCalledWith("/assets?sort=VOLUME", {
      scroll: false,
    });
  });

  it("searches the loaded rows", async () => {
    gqlFetch.mockResolvedValue(page([XLM, USDC]));
    await renderPage();
    await screen.findByText("XLM");

    await userEvent.type(screen.getByRole("searchbox"), "usdc");

    await waitFor(() => expect(screen.queryByText("XLM")).toBeNull());
    expect(screen.getByText("USDC")).toBeDefined();
  });

  it("says the search is limited to loaded rows instead of claiming no match", async () => {
    gqlFetch.mockResolvedValueOnce(
      page([XLM], { hasNextPage: true, cursor: "c2" }),
    );
    await renderPage();
    await screen.findByText("XLM");

    await userEvent.type(screen.getByRole("searchbox"), "zzz");

    // The distinction that matters: an empty page here is a statement about
    // what is loaded, not about the collection.
    await waitFor(() =>
      expect(
        screen.getByText(/covers the 1 asset loaded so far/),
      ).toBeDefined(),
    );
  });

  it("offers a retry when loading a page fails", async () => {
    gqlFetch.mockResolvedValueOnce(
      page([XLM], { hasNextPage: true, cursor: "c2" }),
    );
    await renderPage();
    await screen.findByText("XLM");

    gqlFetch.mockRejectedValueOnce(new Error("network down"));
    await userEvent.click(await screen.findByText("Load more"));

    await waitFor(() =>
      expect(screen.getAllByText("Retry").length).toBeGreaterThan(0),
    );
  });

  it("shows the unavailable state when the indexer cannot be reached", async () => {
    gqlFetch.mockRejectedValue(new Error("no route to host"));

    await renderPage();

    expect(
      await screen.findByText("Lumina data is temporarily unavailable"),
    ).toBeDefined();
  });
});

describe("formatSupply", () => {
  it("groups a supply a float could not represent", () => {
    // parseFloat would round this to 1.2345678901234568e17 and lose the tail,
    // which is someone's actual balance.
    expect(formatSupply("123456789012345678.5000000")).toBe(
      "123,456,789,012,345,678.5",
    );
  });

  it("keeps significant decimals and drops only trailing zeros", () => {
    expect(formatSupply("50000.25")).toBe("50,000.25");
    expect(formatSupply("100.0000000")).toBe("100");
  });

  it("does not invent a fraction for a whole number", () => {
    expect(formatSupply("1000")).toBe("1,000");
  });
});
