// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const nav = vi.hoisted(() => ({
  pathname: "/explorer",
  search: "",
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useSearchParams: () => new URLSearchParams(nav.search),
  useRouter: () => ({ replace: nav.replace }),
}));

import NetworkSwitcher from "./NetworkSwitcher";

afterEach(() => {
  cleanup();
  nav.replace.mockReset();
});

function renderAt(search = "") {
  nav.search = search;
  return render(<NetworkSwitcher />);
}

function select() {
  return screen.getByRole("combobox", { name: "Stellar network" });
}

describe("NetworkSwitcher", () => {
  it("shows the network the URL selects", () => {
    renderAt();
    expect(select()).toHaveValue("mainnet");

    cleanup();
    renderAt("?network=testnet");
    expect(select()).toHaveValue("testnet");
  });

  it("offers every network the app knows about", () => {
    renderAt();
    expect(
      within(select())
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["Mainnet", "Testnet", "Futurenet"]);
  });

  it("puts the chosen network in the URL", async () => {
    // Not in component state: the URL is the selection, so a link copied after
    // switching names the network it was copied from.
    const user = userEvent.setup();
    renderAt();

    await user.selectOptions(select(), "futurenet");

    expect(nav.replace).toHaveBeenCalledWith("/explorer?network=futurenet", {
      scroll: false,
    });
  });

  it("returns to a clean URL when the default network is chosen again", async () => {
    const user = userEvent.setup();
    renderAt("?network=testnet");

    await user.selectOptions(select(), "mainnet");

    expect(nav.replace).toHaveBeenCalledWith("/explorer", { scroll: false });
  });

  it("ignores a value that names no network", () => {
    // The options are ours, so this cannot be reached by choosing one; the
    // guard is what keeps a tampered value out of the URL.
    renderAt();
    fireEvent.change(select(), { target: { value: "lolnet" } });

    expect(nav.replace).not.toHaveBeenCalled();
    expect(select()).toHaveValue("mainnet");
  });

  it("colours the control when the page is not on the default network", () => {
    // Two networks' data look identical, so which one is on screen should not
    // have to be read off the address bar.
    renderAt();
    const neutral = select().className;
    expect(neutral).toContain("border-[var(--color-border-default)]");
    expect(neutral).not.toContain("border-[var(--color-warning-border)]");

    cleanup();
    renderAt("?network=testnet");
    expect(select().className).toContain("border-[var(--color-warning-border)]");
  });
});
