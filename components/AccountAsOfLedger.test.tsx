// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { wcagViolations } from "@/lib/axeScan";
import AccountAsOfLedger from "./AccountAsOfLedger";

const ADDRESS = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS";

afterEach(cleanup);

function field() {
  return screen.getByLabelText("As of ledger") as HTMLInputElement;
}

describe("AccountAsOfLedger", () => {
  it("is a GET form on the account page, so submitting puts the ledger in the URL", () => {
    render(<AccountAsOfLedger address={ADDRESS} view={{ kind: "current" }} />);

    const form = screen.getByRole("form", {
      name: "View this account as of a past ledger",
    });
    expect(form.getAttribute("method")).toBe("get");
    expect(form.getAttribute("action")).toBe(`/accounts/${ADDRESS}`);
    expect(field().name).toBe("ledger");
    expect(field().value).toBe("");
    expect(screen.getByRole("button", { name: "View" })).toBeTruthy();
    // Already showing the current state, so there is nowhere to go back to.
    expect(
      screen.queryByRole("link", { name: "View current state" }),
    ).toBeNull();
  });

  it("explains a pinned view: which recorded state it is, and what may be missing", () => {
    render(
      <AccountAsOfLedger
        address={ADDRESS}
        view={{ kind: "ledger", ledger: 52_000_000 }}
        recordedLedger={51_999_000}
      />,
    );

    expect(field().value).toBe("52000000");
    expect(
      screen.getByText("Viewing this account as of ledger 52,000,000"),
    ).toBeTruthy();
    expect(screen.getByText(/from ledger 51,999,000/)).toBeTruthy();
    expect(
      screen.getByText(
        /changed between ledgers 51,999,000 and 52,000,000, Lumina did not record it/,
      ),
    ).toBeTruthy();
    expect(screen.getByText(/left out of this view/)).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "View current state" })
        .getAttribute("href"),
    ).toBe(`/accounts/${ADDRESS}`);
  });

  it("does not suggest a gap when the recorded state is from the ledger asked for", () => {
    render(
      <AccountAsOfLedger
        address={ADDRESS}
        view={{ kind: "ledger", ledger: 500 }}
        recordedLedger={500}
      />,
    );

    expect(screen.getByText(/from ledger 500\./)).toBeTruthy();
    expect(screen.queryByText(/did not record it/)).toBeNull();
  });

  it("explains a missing recorded state as not observed or pruned, not as nonexistence", () => {
    render(
      <AccountAsOfLedger
        address={ADDRESS}
        view={{ kind: "ledger", ledger: 1234 }}
        recordedLedger={null}
      />,
    );

    expect(
      screen.getByText("No recorded state at or before ledger 1,234"),
    ).toBeTruthy();
    const explanation = screen.getByText(/has not stored a copy/);
    expect(explanation.textContent).toMatch(
      /does not mean the account did not exist/,
    );
    expect(explanation.textContent).toMatch(/not observed/);
    expect(explanation.textContent).toMatch(/pruned/);
  });

  it("flags a value that is not a ledger on the field itself", () => {
    render(
      <AccountAsOfLedger
        address={ADDRESS}
        view={{ kind: "invalid", raw: "abc" }}
      />,
    );

    expect(field().value).toBe("abc");
    expect(field().getAttribute("aria-invalid")).toBe("true");
    expect(screen.getByRole("alert").textContent).toBe(
      "“abc” is not a ledger sequence. Enter a whole number from 1 to 2,147,483,647.",
    );
    expect(
      screen.getByRole("link", { name: "View current state" }),
    ).toBeTruthy();
  });

  it("keeps the selected network across a submission and on the way back", () => {
    const { container } = render(
      <AccountAsOfLedger
        address={ADDRESS}
        view={{ kind: "ledger", ledger: 10 }}
        recordedLedger={10}
        network="testnet"
      />,
    );

    const hidden = container.querySelector<HTMLInputElement>(
      'input[type="hidden"][name="network"]',
    );
    expect(hidden?.value).toBe("testnet");
    expect(
      screen
        .getByRole("link", { name: "View current state" })
        .getAttribute("href"),
    ).toBe(`/accounts/${ADDRESS}?network=testnet`);
  });

  it.each([
    ["current", { kind: "current" as const }, undefined],
    ["pinned", { kind: "ledger" as const, ledger: 9 }, 8],
    ["not recorded", { kind: "ledger" as const, ledger: 9 }, null],
    ["invalid", { kind: "invalid" as const, raw: "x" }, undefined],
  ])("has no WCAG A/AA violations: %s", async (_name, view, recordedLedger) => {
    const { container } = render(
      <AccountAsOfLedger
        address={ADDRESS}
        view={view}
        recordedLedger={recordedLedger}
      />,
    );

    expect(await wcagViolations(container)).toEqual([]);
  });
});
