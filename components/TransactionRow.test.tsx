// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { Transaction } from "@/lib/types";
import TransactionRow from "./TransactionRow";

const HASH = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
const SOURCE = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS";

function tx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    hash: HASH,
    ledger: 1234567,
    createdAt: new Date().toISOString(),
    sourceAccount: SOURCE,
    feeCharged: "1000000",
    operationCount: 3,
    successful: true,
    memoType: null,
    memo: null,
    ...overrides,
  };
}

function renderRow(t: Transaction) {
  return render(
    <table>
      <tbody>
        <TransactionRow tx={t} />
      </tbody>
    </table>
  );
}

afterEach(cleanup);

describe("TransactionRow", () => {
  it("links the hash out to the explorer and the source account inward", () => {
    renderRow(tx());

    const hashLink = screen.getByTitle(HASH);
    expect(hashLink.getAttribute("href")).toContain(HASH);
    expect(hashLink.getAttribute("rel")).toContain("noopener");

    const accountLink = screen.getAllByRole("link").find(a => a.getAttribute("href")?.startsWith("/accounts/"));
    expect(accountLink?.getAttribute("href")).toBe(`/accounts/${SOURCE}`);
  });

  it("converts the fee from stroops", () => {
    // feeCharged is in stroops; showing 1000000 XLM instead of 0.1 would be a
    // seven-order-of-magnitude lie.
    renderRow(tx({ feeCharged: "1000000" }));
    expect(screen.getByText(/0\.1.*XLM/)).toBeTruthy();
  });

  it("distinguishes a failed transaction from a successful one", () => {
    const ok = renderRow(tx({ successful: true }));
    expect(ok.container.querySelector(".bg-\\[\\#16a34a\\]")).not.toBeNull();
    cleanup();

    const failed = renderRow(tx({ successful: false }));
    expect(failed.container.querySelector(".bg-\\[\\#dc2626\\]")).not.toBeNull();
  });

  it("renders the ledger with thousands separators and the operation count", () => {
    renderRow(tx({ ledger: 1234567, operationCount: 3 }));
    expect(screen.getByText("1,234,567")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
  });
});
