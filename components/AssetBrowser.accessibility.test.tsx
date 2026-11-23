// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AssetBrowser, { type AssetSummary } from "./AssetBrowser";

// AssetBrowser reads the network and the route from the App Router, which does
// not exist under Vitest. Without these the component throws before rendering.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/assets",
  useSearchParams: () => new URLSearchParams(),
}));

afterEach(cleanup);

const asset = {
  asset: "USD:GA...",
  native: true,
  code: "USD",
  issuer: "GA...",
  supply: "1000.000",
  holders: 12,
} as unknown as AssetSummary;

describe("AssetBrowser accessibility", () => {
  it("labels search and sort controls and keeps the table region keyboard-focusable", async () => {
    const user = userEvent.setup();
    render(
      <AssetBrowser
        initial={[asset]}
        initialCursor={null}
        initialHasNextPage={false}
        sort="HOLDERS"
      />,
    );

    expect(screen.getByRole("searchbox", { name: /search/i })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Order assets by" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Holders" }).getAttribute("aria-pressed")).toBe("true");
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("searchbox"));

    const region = screen.getByRole("region", { name: "Assets" });
    region.focus();
    expect(document.activeElement).toBe(region);
  });
});
