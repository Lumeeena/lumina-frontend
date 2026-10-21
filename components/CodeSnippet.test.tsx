// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CodeSnippet from "./CodeSnippet";

afterEach(cleanup);

describe("CodeSnippet accessibility", () => {
  it("offers manual copying when clipboard access fails", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("NotAllowedError")) },
    });
    render(<CodeSnippet code="query { ledger }" />);

    await userEvent.click(screen.getByRole("button", { name: "Copy" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/select the code and copy it manually/i);
  });

  it("gives the copy control an accessible name and supports keyboard activation", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<CodeSnippet code="console.log('hello')" title="Example" />);

    const copy = screen.getByRole("button", { name: "Copy" });
    await user.tab();
    expect(document.activeElement).toBe(copy);
    await user.keyboard("{Enter}");

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("console.log('hello')"));
    expect(await screen.findByRole("status")).toHaveTextContent("Code copied to clipboard");
    expect(screen.getByRole("button", { name: "Code copied" })).toBeTruthy();
  });
});
