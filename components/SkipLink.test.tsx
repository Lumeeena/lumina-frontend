// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/i18n", () => ({
  t: vi.fn((key: string) => {
    if (key === "skipLink.skipToMain") return "Skip to main content";
    return key;
  }),
}));

import SkipLink from "./SkipLink";

afterEach(cleanup);

describe("SkipLink", () => {
  it("renders a link with the correct accessible name", () => {
    render(<SkipLink />);

    const link = screen.getByRole("link", { name: "Skip to main content" });
    expect(link).toBeInTheDocument();
  });

  it("links to the main landmark", () => {
    render(<SkipLink />);

    const link = screen.getByRole("link", { name: "Skip to main content" });
    expect(link).toHaveAttribute("href", "#main");
  });

  it("is hidden by default using sr-only class", () => {
    render(<SkipLink />);

    const link = screen.getByRole("link", { name: "Skip to main content" });
    expect(link).toHaveClass("sr-only");
  });

  it("becomes visible when focused", async () => {
    const user = userEvent.setup();
    render(<SkipLink />);

    const link = screen.getByRole("link", { name: "Skip to main content" });

    // Focus the link
    await user.tab();

    // When focused, the sr-only class should be removed
    expect(link).not.toHaveClass("sr-only");
    expect(link).toHaveClass("focus:not-sr-only");
  });

  it("applies focus styles for visibility", async () => {
    const user = userEvent.setup();
    render(<SkipLink />);

    const link = screen.getByRole("link", { name: "Skip to main content" });

    await user.tab();

    // Check that focus-related classes are present
    expect(link).toHaveClass("focus:fixed");
    expect(link).toHaveClass("focus:top-2");
    expect(link).toHaveClass("focus:start-2");
    expect(link).toHaveClass("focus:z-50");
  });

  it("can receive keyboard focus via tab", async () => {
    const user = userEvent.setup();
    render(<SkipLink />);

    await user.tab();

    const link = screen.getByRole("link", { name: "Skip to main content" });
    expect(document.activeElement).toBe(link);
  });
});
