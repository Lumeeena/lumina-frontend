// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { wcagViolations } from "@/lib/axeScan";
import type { SharedWasmContract } from "@/lib/contractInterface";
import SharedWasmContracts from "./SharedWasmContracts";

const AUDITED = "CAYUDQPV3RKPM3EXDFGI3457FV677JLUCJ4OLKWGCUBPRIHYKXK3WFAZ";
const CLONE = "CBQHNAXSI55GX2GN6D67GK7BHVPSLJUGZQEU7WJ5LKR5PNUCGLIMAO4K";
const DEPLOYER = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";

function sibling(
  contractId: string,
  deployedLedger: number,
): SharedWasmContract {
  return {
    contractId,
    deployer: DEPLOYER,
    deployedLedger,
    deployedAt: "2026-11-01T00:00:00Z",
  };
}

afterEach(cleanup);

describe("SharedWasmContracts", () => {
  it("links each same-code contract, its deployer and its deployment ledger", () => {
    render(
      <SharedWasmContracts
        contracts={[sibling(AUDITED, 52_000_000), sibling(CLONE, 52_100_000)]}
        limit={10}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Contracts with the same code" }),
    ).toBeTruthy();
    // Plain selectors rather than role queries, which are slow in jsdom and
    // this test inspects every cell.
    const rows = screen
      .getByRole("table")
      .querySelectorAll<HTMLTableRowElement>("tbody tr");
    expect(rows).toHaveLength(2);
    const first = Array.from(rows[0].querySelectorAll("a"));
    expect(first.map((a) => a.getAttribute("href"))).toEqual([
      `/contracts/${AUDITED}`,
      `/accounts/${DEPLOYER}`,
      "/ledgers/52000000",
    ]);
    expect(first[2].textContent).toBe("52,000,000");
    expect(rows[1].querySelector("a")?.getAttribute("href")).toBe(
      `/contracts/${CLONE}`,
    );
  });

  it("says why identical code matters", () => {
    render(
      <SharedWasmContracts contracts={[sibling(AUDITED, 1)]} limit={10} />,
    );

    expect(screen.getByText(/check who\s+deployed each/)).toBeTruthy();
  });

  it("says so when no other indexed contract shares the code", () => {
    render(<SharedWasmContracts contracts={[]} limit={10} />);

    expect(
      screen.getByText(
        "No other indexed contract was deployed from this wasm.",
      ),
    ).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("marks a full page as the first ones, since the API gives no total", () => {
    const full = Array.from({ length: 3 }, (_, i) =>
      sibling(`${CLONE.slice(0, -1)}${i}`, 100 + i),
    );
    render(<SharedWasmContracts contracts={full} limit={3} />);

    expect(
      screen.getByText("Showing the first 3 contracts with this code."),
    ).toBeTruthy();
  });

  it("does not claim more exist when the page is not full", () => {
    render(
      <SharedWasmContracts contracts={[sibling(AUDITED, 1)]} limit={10} />,
    );

    expect(screen.queryByText(/Showing the first/)).toBeNull();
  });

  it("has no WCAG A/AA violations, with and without siblings", async () => {
    const listed = render(
      <SharedWasmContracts contracts={[sibling(AUDITED, 1)]} limit={10} />,
    );
    expect(await wcagViolations(listed.container)).toEqual([]);
    listed.unmount();

    const empty = render(<SharedWasmContracts contracts={[]} limit={10} />);
    expect(await wcagViolations(empty.container)).toEqual([]);
  });
});
