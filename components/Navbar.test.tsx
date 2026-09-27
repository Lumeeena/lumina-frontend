// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const nav = vi.hoisted(() => ({
  pathname: "/",
  search: "",
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useSearchParams: () => new URLSearchParams(nav.search),
  useRouter: () => ({ replace: nav.replace }),
}));

import { NAV_ROUTES } from "@/lib/routes";
import Navbar from "./Navbar";

afterEach(cleanup);

function renderAt(path: string, search = "") {
  nav.pathname = path;
  nav.search = search;
  return render(<Navbar />);
}

describe("Navbar", () => {
  it("links to every section", () => {
    renderAt("/");
    for (const label of ["Explorer", "Transactions", "Contract Events", "GraphQL", "Registry", "Stats"]) {
      expect(screen.getByRole("link", { name: label })).toBeTruthy();
    }
    expect(screen.getByRole("link", { name: /lumina/i }).getAttribute("href")).toBe("/");
  });

  it("marks the current section as active", () => {
    renderAt("/registry");
    const active = screen.getByRole("link", { name: "Registry" });
    const inactive = screen.getByRole("link", { name: "Stats" });

    expect(active.className).toContain("bg-[var(--color-bg-raised)]");
    expect(inactive.className).not.toContain("bg-[var(--color-bg-raised)]");
  });

  it("keeps the section active on nested routes", () => {
    // /accounts/G... is reached from the explorer; a nav that de-highlights
    // as soon as you click through is worse than no highlight at all.
    renderAt("/transactions/abc123");
    expect(screen.getByRole("link", { name: "Transactions" }).className).toContain("bg-[var(--color-bg-raised)]");
  });

  it("highlights nothing on a route outside the nav", () => {
    renderAt("/");
    for (const label of ["Explorer", "Transactions", "Registry"]) {
      expect(screen.getByRole("link", { name: label }).className).not.toContain("bg-[var(--color-bg-raised)]");
    }
  });

  it("carries the selected network on every link", () => {
    // The selection is in the URL, so it has to survive being navigated with —
    // otherwise a shared testnet link reverts to the default on the first click.
    renderAt("/explorer", "?network=testnet");
    for (const route of NAV_ROUTES) {
      expect(screen.getByRole("link", { name: route.label })).toHaveAttribute(
        "href",
        `${route.path}?network=testnet`,
      );
    }
  });

  it("keeps you on the same network from the wordmark", () => {
    renderAt("/explorer", "?network=futurenet");
    expect(screen.getByRole("link", { name: /lumina/i })).toHaveAttribute(
      "href",
      "/?network=futurenet",
    );
  });

  it("writes no network into the links on the default network", () => {
    // The hrefs an unparameterised link has always produced, so the canonical
    // URLs of every page stay exactly what they were.
    renderAt("/explorer");
    for (const route of NAV_ROUTES) {
      expect(screen.getByRole("link", { name: route.label })).toHaveAttribute(
        "href",
        route.path,
      );
    }
    expect(screen.getByRole("link", { name: /lumina/i })).toHaveAttribute("href", "/");
  });

  it("offers the switcher, showing the network the URL selects", () => {
    renderAt("/explorer", "?network=testnet");
    expect(screen.getByRole("combobox", { name: "Stellar network" })).toHaveValue("testnet");
  });
});
