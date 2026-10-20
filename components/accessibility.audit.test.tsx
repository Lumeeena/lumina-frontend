// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import axe from "axe-core";
import AssetBrowser, { type AssetSummary } from "./AssetBrowser";
import BackendUnavailable from "./BackendUnavailable";
import CodeSnippet from "./CodeSnippet";
import ConnectionIndicator from "./ConnectionIndicator";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ refresh: vi.fn(), replace: vi.fn() })),
  usePathname: vi.fn(() => "/assets"),
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

async function expectNoA11yViolations() {
  // jsdom has no layout engine, so axe's color-contrast rule cannot produce a
  // meaningful result here. Contrast is handled with the application's semantic
  // color tokens and should also be checked in a real-browser audit.
  const results = await axe.run(document.body, {
    runOnly: {
      type: "tag",
      values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
    },
    rules: { "color-contrast": { enabled: false } },
  });
  expect(results.violations.map(({ id, impact, help }) => ({ id, impact, help }))).toEqual([]);
}

describe("component accessibility audit", () => {
  it("BackendUnavailable passes axe's WCAG rules", async () => {
    render(<BackendUnavailable onRetry={() => {}} />);
    await expectNoA11yViolations();
  });

  it("CodeSnippet passes axe's WCAG rules", async () => {
    render(<CodeSnippet code="const answer = 42;" title="Example" />);
    await expectNoA11yViolations();
  });

  it("ConnectionIndicator passes axe's WCAG rules", async () => {
    render(<ConnectionIndicator state="connected" />);
    await expectNoA11yViolations();
  });

  it("AssetBrowser passes axe's WCAG rules", async () => {
    render(
      <AssetBrowser
        initial={[asset]}
        initialCursor={null}
        initialHasNextPage={false}
        sort="HOLDERS"
      />,
    );
    await expectNoA11yViolations();
  });
});
