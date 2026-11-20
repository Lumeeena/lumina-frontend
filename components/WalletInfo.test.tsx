// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WalletInfo from "./WalletInfo";

afterEach(cleanup);

describe("WalletInfo", () => {
  it("shows the connected wallet name, accessible icon, and truncated address", () => {
    render(
      <WalletInfo
        address="GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS"
        walletName="Freighter"
        walletIcon="/freighter.svg"
        onDisconnect={vi.fn()}
      />,
    );

    expect(screen.getByRole("img", { name: "Freighter" })).toBeTruthy();
    expect(screen.getByText("Freighter")).toBeTruthy();
    expect(screen.getByText("GABCDEF...NOPQRS")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Disconnect wallet" })).toBeTruthy();
  });

  it("uses a wallet-name fallback icon and disables disconnect while it is in progress", async () => {
    const onDisconnect = vi.fn();
    render(
      <WalletInfo
        address="GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS"
        walletName="Freighter"
        walletIcon=""
        onDisconnect={onDisconnect}
        disconnecting
      />,
    );

    expect(screen.getByText("F").getAttribute("aria-hidden")).toBe("true");
    const button = screen.getByRole("button", { name: "Disconnect wallet" });
    expect(button.textContent).toBe("Disconnecting…");
    expect(button.hasAttribute("disabled")).toBe(true);

    await userEvent.click(button);
    expect(onDisconnect).not.toHaveBeenCalled();
  });
});
