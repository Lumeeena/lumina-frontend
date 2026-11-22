// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SlashRecord } from "@/lib/registry";

// The component imports `getSlashes` lazily; mocking the module keeps the
// Soroban RPC out of the test.
const getSlashes = vi.fn<(contractId: string) => Promise<SlashRecord[]>>();
vi.mock("@/lib/registry", () => ({
  getSlashes: (contractId: string) => getSlashes(contractId),
}));

import RegistrySlashHistory from "./RegistrySlashHistory";

const CONTRACT_ID = "CAYUDQPV3RKPM3EXDFGI3457FV677JLUCJ4OLKWGCUBPRIHYKXK3WFAZ";

beforeEach(() => {
  getSlashes.mockReset();
});

afterEach(cleanup);

function renderHistory() {
  const user = userEvent.setup();
  render(<RegistrySlashHistory contractId={CONTRACT_ID} />);
  return { user, toggle: () => screen.getByRole("button") };
}

describe("RegistrySlashHistory", () => {
  it("starts collapsed and does not read history until opened", () => {
    const { toggle } = renderHistory();

    expect(toggle()).toHaveAccessibleName("Slash history");
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(getSlashes).not.toHaveBeenCalled();
  });

  it("shows a loading message, then 'No slashes recorded.' when there are none", async () => {
    let resolve: (rows: SlashRecord[]) => void = () => {};
    getSlashes.mockReturnValue(new Promise((r) => (resolve = r)));
    const { user, toggle } = renderHistory();

    await user.click(toggle());

    expect(getSlashes).toHaveBeenCalledWith(CONTRACT_ID);
    expect(toggle()).toHaveAccessibleName("Hide slash history");
    expect(toggle()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Loading slash history…")).toBeInTheDocument();

    resolve([]);

    expect(await screen.findByText("No slashes recorded.")).toBeInTheDocument();
    expect(screen.queryByText("Loading slash history…")).not.toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("lists every slash in order with its amount, reason and ledger", async () => {
    getSlashes.mockResolvedValue([
      { amount: BigInt(25_000_000), reason: "Spam metadata", slashedAt: 1234567 },
      { amount: BigInt(10_000_000_000), reason: "Impersonation", slashedAt: 42 },
      { amount: BigInt(1), reason: "Dust", slashedAt: 7 },
    ]);
    const { user, toggle } = renderHistory();

    await user.click(toggle());

    const items = within(await screen.findByRole("list")).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("−2.5 XLM · Spam metadata");
    expect(items[0]).toHaveTextContent(`ledger ${(1234567).toLocaleString()}`);
    expect(items[1]).toHaveTextContent("−1,000 XLM · Impersonation");
    expect(items[1]).toHaveTextContent("ledger 42");
    expect(items[2]).toHaveTextContent("−0.0000001 XLM · Dust");
    expect(items[2]).toHaveTextContent("ledger 7");
  });

  it("shows an alert when the history cannot be read", async () => {
    getSlashes.mockRejectedValue(new Error("rpc down"));
    const { user, toggle } = renderHistory();

    await user.click(toggle());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Couldn't read the slash history. Close and reopen to retry.",
    );
    expect(screen.queryByText("Loading slash history…")).not.toBeInTheDocument();
  });

  it("retries after an error when closed and reopened", async () => {
    getSlashes
      .mockRejectedValueOnce(new Error("rpc down"))
      .mockResolvedValueOnce([
        { amount: BigInt(50_000_000), reason: "Late", slashedAt: 9 },
      ]);
    const { user, toggle } = renderHistory();

    await user.click(toggle());
    await screen.findByRole("alert");
    await user.click(toggle());
    await user.click(toggle());

    expect(await screen.findByRole("listitem")).toHaveTextContent("−5 XLM · Late");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(getSlashes).toHaveBeenCalledTimes(2);
  });

  it("hides the history when closed and reuses it when reopened", async () => {
    getSlashes.mockResolvedValue([
      { amount: BigInt(30_000_000), reason: "Spam", slashedAt: 5 },
    ]);
    const { user, toggle } = renderHistory();

    await user.click(toggle());
    await screen.findByRole("list");

    await user.click(toggle());
    expect(toggle()).toHaveAccessibleName("Slash history");
    expect(toggle()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();

    await user.click(toggle());
    expect(screen.getByRole("listitem")).toHaveTextContent("−3 XLM · Spam");
    expect(getSlashes).toHaveBeenCalledTimes(1);
  });
});
