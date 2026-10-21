// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ContractStorageKeyHistory from "./ContractStorageKeyHistory";

afterEach(cleanup);

describe("ContractStorageKeyHistory accessibility", () => {
  it("exposes disclosure state and supports keyboard toggling", async () => {
    render(
      <ContractStorageKeyHistory
        contractId="contract"
        storageKey="key"
        history={[]}
        currentValue="value"
        currentLedger={42}
        hasCompleteHistory
      />,
    );

    const disclosure = screen.getByRole("button", { name: /ledger 42/i });
    const panelId = disclosure.getAttribute("aria-controls");
    expect(disclosure).toHaveAttribute("aria-expanded", "true");
    expect(panelId).toBeTruthy();
    expect(document.getElementById(panelId!)).toBeInTheDocument();

    disclosure.focus();
    await userEvent.keyboard("{Enter}");
    expect(disclosure).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById(panelId!)).toHaveAttribute("hidden");
  });
});
