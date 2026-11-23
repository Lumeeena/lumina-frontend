// @vitest-environment jsdom
/**
 * The asset browser must stay on one network from first render to last page.
 * Each of these was a way for a testnet list to quietly pick up mainnet rows:
 * the sort link dropping `?network=`, and "Load more" fetching without one.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const gqlFetch = vi.hoisted(() => vi.fn());
const nav = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: nav.replace, refresh: vi.fn() }),
  usePathname: () => "/assets",
  useSearchParams: () => new URLSearchParams("network=testnet"),
}));

vi.mock("@/lib/graphql", () => ({
  gqlFetch,
  GRAPHQL_URL: "http://test/graphql",
  PUBLIC_GRAPHQL_URL: "http://test/graphql",
}));

import AssetBrowser, { type AssetSummary } from "./AssetBrowser";

const first = {
  asset: "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
  code: "USDC",
  issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
  native: false,
  supply: "50000.25",
  holders: 120,
} as unknown as AssetSummary;

const second = {
  asset: "EURC:GB1",
  code: "EURC",
  issuer: "GB1",
  native: false,
  supply: "10",
  holders: 3,
} as unknown as AssetSummary;

describe("AssetBrowser on a non-default network", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(cleanup);

  it("keeps the selected network when the ordering changes", async () => {
    const user = userEvent.setup();
    render(
      <AssetBrowser
        initial={[first]}
        initialCursor={null}
        initialHasNextPage={false}
        sort="HOLDERS"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Volume" }));

    expect(nav.replace).toHaveBeenCalledTimes(1);
    expect(nav.replace).toHaveBeenCalledWith("/assets?sort=VOLUME&network=testnet", {
      scroll: false,
    });
  });

  it("requests the next page from the selected network, with its cursor", async () => {
    const user = userEvent.setup();
    gqlFetch.mockResolvedValueOnce({
      assets: {
        items: [second],
        pageInfo: { hasNextPage: false, cursor: null },
      },
    });
    render(
      <AssetBrowser
        initial={[first]}
        initialCursor="after-usdc"
        initialHasNextPage
        sort="HOLDERS"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Load more" }));

    await waitFor(() => expect(gqlFetch).toHaveBeenCalledTimes(1));
    expect(gqlFetch.mock.calls[0]?.[2]).toMatchObject({
      cursor: "after-usdc",
      sortBy: "HOLDERS",
      network: "TESTNET",
    });
    expect(await screen.findByText("EURC")).toBeTruthy();
  });
});
