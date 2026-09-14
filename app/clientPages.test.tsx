// @vitest-environment jsdom
/**
 * Tests for the client-rendered pages.
 *
 * Kept apart from `pages.test.tsx` because these need `next/navigation`'s
 * client hooks rather than resolved server components, and the two sets of
 * mocks do not coexist cleanly in one file.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/transactions",
}));

vi.mock("@/lib/graphql", () => ({
  gqlFetch: vi.fn().mockResolvedValue({ transactions: { items: [], pageInfo: { hasNextPage: false, cursor: null } } }),
  GRAPHQL_URL: "http://test/graphql",
  PUBLIC_GRAPHQL_URL: "http://test/graphql",
}));

import HomePage from "./page";
import ExplorerPage from "./explorer/page";
import TransactionsPage from "./transactions/page";
import GraphQLPage from "./graphql/page";

afterEach(cleanup);

describe("HomePage", () => {
  it("renders the landing heading and links into the app", async () => {
    // An async server component: resolve it, then render what it returned.
    render(await HomePage());

    expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
    const hrefs = screen.getAllByRole("link").map(a => a.getAttribute("href"));
    expect(hrefs).toContain("/graphql");
  });
});

describe("ExplorerPage", () => {
  it("renders an account search that submits to the accounts route", () => {
    render(<ExplorerPage />);

    const input = screen.getByPlaceholderText(/stellar account address/i);
    // The search is a plain GET form, so the field name is what builds the URL.
    expect(input.getAttribute("name")).toBe("address");
    expect(input.closest("form")?.getAttribute("action")).toBe("/accounts");
  });

  it("mounts the shared transaction explorer", async () => {
    render(<ExplorerPage />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Explorer");
    await waitFor(() =>
      expect(screen.getByRole("heading", { level: 2, name: /recent transactions/i })).toBeTruthy()
    );
  });
});

describe("TransactionsPage", () => {
  it("renders inside a Suspense boundary the explorer requires", () => {
    // `TransactionExplorer` calls `useSearchParams`, which Next refuses to
    // render outside Suspense — losing the boundary would break the build
    // rather than a test, so this pins it.
    render(<TransactionsPage />);

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Transactions");
  });
});

describe("GraphQLPage", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("starts with the first example query loaded in the editor", () => {
    render(<GraphQLPage />);

    const editor = screen.getByRole("textbox") as HTMLTextAreaElement;
    expect(editor.value).toContain("query");
  });

  it("posts the editor contents and renders the response", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { latestLedger: { sequence: 4242 } } }),
    });
    render(<GraphQLPage />);

    await userEvent.click(screen.getByRole("button", { name: /run/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(JSON.parse(init.body).query).toContain("query");
    await waitFor(() => expect(screen.getByText(/4242/)).toBeTruthy());
  });

  it("reports a failed query instead of silently showing nothing", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("fetch failed"));
    render(<GraphQLPage />);

    await userEvent.click(screen.getByRole("button", { name: /run/i }));

    // The page reports an unreachable server in its own words rather than
    // surfacing the raw fetch rejection.
    await waitFor(() => expect(screen.getByText(/couldn't reach the graphql server/i)).toBeTruthy());
  });
});
