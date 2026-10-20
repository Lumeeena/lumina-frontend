// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PendingTransactions from "./PendingTransactions";
import {
  __resetPendingTransactions,
  trackTransaction,
} from "@/lib/pendingTransactions";

beforeEach(() => {
  __resetPendingTransactions();
});

afterEach(cleanup);

describe("PendingTransactions", () => {
  it("renders nothing when no transaction has been submitted", () => {
    const { container } = render(<PendingTransactions />);

    expect(container.firstChild).toBeNull();
  });

  it("shows an in-flight transaction with the phase it is in", () => {
    void trackTransaction("Deactivate CABC…", (report) => {
      report("confirming");
      return new Promise<{ hash: string }>(() => {});
    });

    render(<PendingTransactions />);

    expect(screen.getByRole("region", { name: "Transactions" })).toBeTruthy();
    expect(screen.getByText("Deactivate CABC…")).toBeTruthy();
    expect(screen.getByText("Confirming on the network")).toBeTruthy();
  });

  it("does not announce an in-flight phase change", () => {
    void trackTransaction("Stake", (report) => {
      report("submitting");
      return new Promise<{ hash: string }>(() => {});
    });

    render(<PendingTransactions />);

    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("announces a confirmed transaction and lets the user dismiss it", async () => {
    const user = userEvent.setup();
    await trackTransaction("Register Protocol", async () => ({ hash: "abc" }));

    render(<PendingTransactions />);

    expect(screen.getByRole("status").textContent).toBe("Confirmed");
    await user.click(screen.getByRole("button", { name: "Dismiss: Register Protocol" }));

    expect(screen.queryByText("Register Protocol")).toBeNull();
  });

  it("announces a failure with its message as an alert", async () => {
    await trackTransaction("Withdraw", async () => {
      throw new Error("Signature was declined in your wallet.");
    }).catch(() => undefined);

    render(<PendingTransactions />);

    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Failed");
    expect(alert.textContent).toContain("Signature was declined in your wallet.");
  });

  it("falls back to a generic failure line when the error has no message", async () => {
    await trackTransaction("Withdraw", async () => {
      throw "not an Error";
    }).catch(() => undefined);

    render(<PendingTransactions />);

    expect(screen.getByRole("alert").textContent).toContain(
      "The transaction did not complete.",
    );
  });

  it("removes a settled row from the screen when it is dismissed", async () => {
    const user = userEvent.setup();
    await trackTransaction("Register One", async () => ({ hash: "h1" }));
    await trackTransaction("Register Two", async () => ({ hash: "h2" }));

    render(<PendingTransactions />);
    await user.click(screen.getByRole("button", { name: "Dismiss: Register One" }));

    await waitFor(() => expect(screen.queryByText("Register One")).toBeNull());
    expect(screen.getByText("Register Two")).toBeTruthy();
  });
});
