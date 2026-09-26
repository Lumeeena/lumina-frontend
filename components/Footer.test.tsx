// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import Footer from "./Footer";

afterEach(cleanup);

describe("Footer", () => {
  it("shows the frontend version", () => {
    render(<Footer />);
    expect(screen.getByTestId("app-version").textContent).toMatch(/^Lumina frontend v/);
  });

  it("copies the version text for bug reports", () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<Footer />);

    fireEvent.click(screen.getByRole("button", { name: /copy version/i }));

    expect(writeText).toHaveBeenCalledWith(screen.getByTestId("app-version").textContent);
  });
});
