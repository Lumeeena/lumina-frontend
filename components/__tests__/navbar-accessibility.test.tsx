/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import Navbar from "../Navbar";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => <a href={href} {...props}>{children}</a>,
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/explorer" }));
vi.mock("@/lib/useNetwork", () => ({ useNetwork: () => ({ network: "mainnet" }) }));
vi.mock("@/lib/routes", () => ({ NAV_ROUTES: [{ path: "/explorer", label: "Explorer" }, { path: "/account", label: "Account" }] }));
vi.mock("@/lib/network", () => ({ DEFAULT_NETWORK: "mainnet", withNetwork: (path: string) => path }));
vi.mock("../NetworkSwitcher", () => ({ default: () => <button type="button">Network</button> }));
vi.mock("../LocaleSwitcher", () => ({ default: () => <label>Language <select aria-label="Select language"><option>English</option></select></label> }));
vi.mock("@/components/ThemeToggle", () => ({ default: () => <button type="button" aria-label="Toggle theme">Theme</button> }));

afterEach(cleanup);

describe("accessibility audit: Navbar", () => {
  it("labels the navigation landmark and exposes the current page", async () => {
    render(<Navbar />);
    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: "Explorer" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Account" })).not.toHaveAttribute("aria-current");
  });

  it("provides named controls and keyboard-focusable links", async () => {
    render(<Navbar />);
    const home = screen.getByRole("link", { name: "Lumina home" });
    home.focus();
    expect(home).toHaveFocus();
    expect(screen.getByRole("button", { name: "Toggle theme" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Select language" })).toBeInTheDocument();
  });
});
