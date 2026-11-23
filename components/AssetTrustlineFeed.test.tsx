// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import AssetTrustlineFeed, {
  type AssetTrustlineChange,
} from "./AssetTrustlineFeed";

afterEach(cleanup);

const HASH = "f".repeat(64);
const ACCOUNT = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";

const change: AssetTrustlineChange = {
  id: "op-1",
  createdAt: "2026-03-14T09:30:00Z",
  transactionHash: HASH,
  sourceAccount: ACCOUNT,
  amount: "1000.0000000",
};

describe("AssetTrustlineFeed", () => {
  it("lists each change with its day, account, limit and transaction", () => {
    render(
      <AssetTrustlineFeed
        assetLabel="USDC"
        items={[change]}
        unavailable={false}
        network="mainnet"
      />,
    );

    const table = screen.getByRole("table");
    expect(within(table).getByText("2026-03-14")).toBeTruthy();
    expect(within(table).getByText("1000.0000000")).toBeTruthy();
    expect(within(table).getByTitle(ACCOUNT)).toBeTruthy();
  });

  it("keeps the mainnet default off transaction links", () => {
    render(
      <AssetTrustlineFeed
        assetLabel="USDC"
        items={[change]}
        unavailable={false}
        network="mainnet"
      />,
    );

    expect(screen.getByRole("link").getAttribute("href")).toBe(
      `/transactions/${HASH}`,
    );
  });

  it("keeps a non-default network on transaction links, so the reader stays on it", () => {
    render(
      <AssetTrustlineFeed
        assetLabel="USDC"
        items={[change]}
        unavailable={false}
        network="testnet"
      />,
    );

    expect(screen.getByRole("link").getAttribute("href")).toBe(
      `/transactions/${HASH}?network=testnet`,
    );
  });

  it("shows a dash when a change carries no limit", () => {
    render(
      <AssetTrustlineFeed
        assetLabel="USDC"
        items={[{ ...change, amount: null }]}
        unavailable={false}
        network="mainnet"
      />,
    );

    expect(
      within(screen.getByRole("table")).getByText("—"),
    ).toBeTruthy();
  });

  it("says when nothing has been indexed for the asset yet", () => {
    render(
      <AssetTrustlineFeed
        assetLabel="USDC"
        items={[]}
        unavailable={false}
        network="mainnet"
      />,
    );

    expect(
      screen.getByText("No trustline changes indexed for USDC yet."),
    ).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("reports an unavailable read instead of claiming the asset has no history", () => {
    render(
      <AssetTrustlineFeed
        assetLabel="USDC"
        items={[]}
        unavailable
        network="mainnet"
      />,
    );

    expect(screen.getByRole("status").textContent).toContain(
      "could not be loaded right now",
    );
    expect(screen.queryByText(/No trustline changes indexed/)).toBeNull();
  });
});
