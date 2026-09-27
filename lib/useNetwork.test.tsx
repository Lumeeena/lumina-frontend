// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
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

import { useNetwork } from "./useNetwork";

function Probe() {
  const { network, setNetwork } = useNetwork();
  return (
    <div>
      <span data-testid="network">{network}</span>
      <button type="button" onClick={() => setNetwork("futurenet")}>
        Futurenet
      </button>
      <button type="button" onClick={() => setNetwork("mainnet")}>
        Mainnet
      </button>
    </div>
  );
}

function renderAt(pathname: string, search: string) {
  nav.pathname = pathname;
  nav.search = search;
  return render(<Probe />);
}

function shown() {
  return screen.getByTestId("network").textContent;
}

beforeEach(() => nav.replace.mockReset());
afterEach(cleanup);

describe("useNetwork", () => {
  it("reads the selected network out of the URL", () => {
    renderAt("/explorer", "?network=testnet");
    expect(shown()).toBe("testnet");
  });

  it("defaults to mainnet and leaves the URL alone when it says nothing", () => {
    renderAt("/explorer", "");
    expect(shown()).toBe("mainnet");
    expect(nav.replace).not.toHaveBeenCalled();
  });

  it("corrects a URL that names a network we do not know", () => {
    // The page has to render on something, and the address bar should stop
    // claiming otherwise once it has.
    renderAt("/explorer", "?network=lolnet");
    expect(shown()).toBe("mainnet");
    expect(nav.replace).toHaveBeenCalledWith("/explorer", { scroll: false });
  });

  it("drops a parameter that says nothing the default does not", () => {
    renderAt("/explorer", "?network=mainnet");
    expect(shown()).toBe("mainnet");
    expect(nav.replace).toHaveBeenCalledWith("/explorer", { scroll: false });
  });

  it("keeps the rest of the query string while correcting the network", () => {
    renderAt("/search", "?q=order+123&network=lolnet");
    expect(nav.replace).toHaveBeenCalledWith("/search?q=order+123", {
      scroll: false,
    });
  });

  it("normalises the case of a value somebody typed by hand", () => {
    renderAt("/explorer", "?network=TESTNET");
    expect(shown()).toBe("testnet");
    expect(nav.replace).toHaveBeenCalledWith("/explorer?network=testnet", {
      scroll: false,
    });
  });

  it("moves to another network, keeping the path and the other parameters", async () => {
    const user = userEvent.setup();
    renderAt("/transactions/abc123", "?status=success");

    await user.click(screen.getByRole("button", { name: "Futurenet" }));

    expect(nav.replace).toHaveBeenCalledWith(
      "/transactions/abc123?status=success&network=futurenet",
      { scroll: false },
    );
  });

  it("leaves no parameter behind when returning to the default network", async () => {
    const user = userEvent.setup();
    renderAt("/transactions/abc123", "?network=testnet&status=success");

    await user.click(screen.getByRole("button", { name: "Mainnet" }));

    expect(nav.replace).toHaveBeenCalledWith(
      "/transactions/abc123?status=success",
      { scroll: false },
    );
  });
});
