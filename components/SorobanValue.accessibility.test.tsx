// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SorobanValue from "./SorobanValue";

const ADDRESS = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS";

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

describe("SorobanValue accessibility", () => {
  it("uses semantic details/summary for collapsible sections with keyboard support", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SorobanValue
        value={{ owner: ADDRESS, settings: [true, { mode: "safe" }] }}
      />,
    );
    
    const details = container.querySelector("details");
    const summary = container.querySelector("summary");
    
    expect(details).toBeTruthy();
    expect(summary).toBeTruthy();
    
    summary?.focus();
    expect(document.activeElement).toBe(summary);
  });

  it("copy button has accessible name and keyboard operability", async () => {
    render(<SorobanValue value={{ address: ADDRESS }} />);
    
    const copyButton = screen.getByRole("button", { name: /copy address/i });
    expect(copyButton).toBeTruthy();
    
    copyButton.focus();
    expect(document.activeElement).toBe(copyButton);
  });

  it("raw toggle button is keyboard operable with proper labels", async () => {
    const user = userEvent.setup();
    render(
      <SorobanValue
        value={{ string: "test" }}
        showRawToggle
        rawValue="AAAAAQAAAAA="
      />,
    );
    
    const toggleButton = screen.getByRole("button", { name: /Raw XDR|Decoded/ });
    expect(toggleButton).toBeTruthy();
    
    toggleButton.focus();
    expect(document.activeElement).toBe(toggleButton);
    
    await user.keyboard("{Enter}");
    expect(screen.getByText("AAAAAQAAAAA=")).toBeTruthy();
  });

  it("raw copy button has accessible title and feedback", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    
    render(
      <SorobanValue
        value={{ string: "test" }}
        showRawToggle
        rawValue="AAAAAQAAAAA="
      />,
    );
    
    const toggleButton = screen.getByRole("button", { name: /Raw XDR|Decoded/ });
    await user.click(toggleButton);
    
    const copyButton = screen.getByRole("button", { name: /Copy/i });
    expect(copyButton).toHaveAttribute("title", "Copy raw value");
    
    await user.click(copyButton);
    expect(screen.getByText("✓")).toBeTruthy();
  });

  it("uses color tokens from design system for proper contrast", () => {
    const { container } = render(
      <SorobanValue value={{ status: true }} />,
    );
    
    const textElements = container.querySelectorAll('[class*="text-[var(--color-"]');
    expect(textElements.length).toBeGreaterThan(0);
  });

  it("buttons use appropriate transition classes for visual feedback", () => {
    render(
      <SorobanValue
        value={{ string: "test" }}
        showRawToggle
        rawValue="AAAAAQAAAAA="
      />,
    );
    
    const button = screen.getByRole("button");
    expect(button.className).toContain("transition");
  });
});
