// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const reportError = vi.fn<(error: unknown, source: string) => Promise<void>>();
vi.mock("@/lib/errorReporting", () => ({
  reportError: (error: unknown, source: string) => reportError(error, source),
}));

import RouteError from "./RouteError";

beforeEach(() => {
  reportError.mockReset().mockResolvedValue(undefined);
  // The boundary logs the error on purpose; keep it out of the test output.
  vi.mocked(console.error).mockImplementation(() => {});
});

afterEach(cleanup);

function makeError(digest?: string) {
  const error = new Error("boom") as Error & { digest?: string };
  if (digest) error.digest = digest;
  return error;
}

describe("RouteError", () => {
  it("names the route that failed and explains how to recover", () => {
    render(<RouteError error={makeError()} reset={vi.fn()} route="Ledgers" />);

    expect(screen.getByText("Failed to load Ledgers")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This is usually a temporary issue reaching the Stellar network. The rest of the app is still available.",
      ),
    ).toBeInTheDocument();
  });

  it("calls reset once when 'Try again' is pressed", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    render(<RouteError error={makeError()} reset={reset} route="Ledgers" />);

    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(reset).toHaveBeenCalledTimes(1);
    expect(reset).toHaveBeenCalledWith();
  });

  it("can be retried from the keyboard", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    render(<RouteError error={makeError()} reset={reset} route="Ledgers" />);

    await user.tab();
    expect(screen.getByRole("button", { name: "Try again" })).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("shows the error digest when the error has one", () => {
    render(<RouteError error={makeError("abc123")} reset={vi.fn()} route="Ledgers" />);

    expect(screen.getByText("Error digest: abc123")).toBeInTheDocument();
  });

  it("shows no digest line when the error has none", () => {
    render(<RouteError error={makeError()} reset={vi.fn()} route="Ledgers" />);

    expect(screen.queryByText(/Error digest/)).not.toBeInTheDocument();
  });

  it("logs and reports the error once per error, tagged with the route", () => {
    const error = makeError();
    const { rerender } = render(<RouteError error={error} reset={vi.fn()} route="Ledgers" />);

    expect(console.error).toHaveBeenCalledWith("[Ledgers]", error);
    expect(reportError).toHaveBeenCalledTimes(1);
    expect(reportError).toHaveBeenCalledWith(error, "boundary");

    rerender(<RouteError error={error} reset={vi.fn()} route="Ledgers" />);
    expect(reportError).toHaveBeenCalledTimes(1);

    const next = makeError();
    rerender(<RouteError error={next} reset={vi.fn()} route="Ledgers" />);
    expect(reportError).toHaveBeenCalledTimes(2);
    expect(reportError).toHaveBeenLastCalledWith(next, "boundary");
  });
});
