// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const pathname = vi.hoisted(() => ({ current: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

import Navbar from "./Navbar";

afterEach(cleanup);

function renderAt(path: string) {
  pathname.current = path;
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

    expect(active.className).toContain("bg-[#f6f5f8]");
    expect(inactive.className).not.toContain("bg-[#f6f5f8]");
  });

  it("keeps the section active on nested routes", () => {
    // /accounts/G... is reached from the explorer; a nav that de-highlights
    // as soon as you click through is worse than no highlight at all.
    renderAt("/transactions/abc123");
    expect(screen.getByRole("link", { name: "Transactions" }).className).toContain("bg-[#f6f5f8]");
  });

  it("highlights nothing on a route outside the nav", () => {
    renderAt("/");
    for (const label of ["Explorer", "Transactions", "Registry"]) {
      expect(screen.getByRole("link", { name: label }).className).not.toContain("bg-[#f6f5f8]");
    }
  });
});
