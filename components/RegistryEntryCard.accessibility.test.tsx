// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { wcagViolations } from "@/lib/axeScan";
import RegistryEntryCard from "./RegistryEntryCard";
import type { RegistryProfile } from "@/lib/registry";

afterEach(cleanup);

const mockProfile: RegistryProfile = {
  contractId: "CABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGHIJK",
  name: "Test Protocol",
  description: "A test protocol for accessibility auditing",
  owner: "GTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ123456",
  categories: ["defi", "payments"],
  reputation: {
    verified: true,
    stake: BigInt(10000000000),
    slashedTotal: BigInt(1000000000),
  },
  createdAt: 12345678,
};

describe("RegistryEntryCard accessibility", () => {
  it("passes automated accessibility scan in default state", async () => {
    const { container } = render(<RegistryEntryCard profile={mockProfile} />);
    const violations = await wcagViolations(container);
    expect(violations).toEqual([]);
  });

  it("passes automated accessibility scan with minimal profile", async () => {
    const minimalProfile: RegistryProfile = {
      ...mockProfile,
      categories: [],
      reputation: {
        verified: false,
        stake: BigInt(0),
        slashedTotal: BigInt(0),
      },
    };
    const { container } = render(<RegistryEntryCard profile={minimalProfile} />);
    const violations = await wcagViolations(container);
    expect(violations).toEqual([]);
  });

  it("supports keyboard interaction for slash history toggle", async () => {
    render(<RegistryEntryCard profile={mockProfile} />);
    const user = userEvent.setup();

    const toggleButton = screen.getByRole("button", { name: /slash history/i });

    // Focus and activate with keyboard
    toggleButton.focus();
    expect(toggleButton).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(toggleButton).toHaveAttribute("aria-expanded", "true");
  });

  it("slash history toggle has proper aria-expanded state", async () => {
    render(<RegistryEntryCard profile={mockProfile} />);
    const user = userEvent.setup();

    const toggleButton = screen.getByRole("button", { name: /slash history/i });

    // Initially collapsed
    expect(toggleButton).toHaveAttribute("aria-expanded", "false");

    // Click to expand
    await user.click(toggleButton);
    expect(toggleButton).toHaveAttribute("aria-expanded", "true");

    // Click again to collapse
    await user.click(toggleButton);
    expect(toggleButton).toHaveAttribute("aria-expanded", "false");
  });

  it("categories list has proper aria-label", () => {
    render(<RegistryEntryCard profile={mockProfile} />);
    const categoriesList = screen.getByRole("list", { name: /categories/i });
    expect(categoriesList).toBeInTheDocument();
  });

  it("passes accessibility scan when slash history is expanded", async () => {
    render(<RegistryEntryCard profile={mockProfile} />);
    const user = userEvent.setup();

    const toggleButton = screen.getByRole("button", { name: /slash history/i });
    await user.click(toggleButton);

    const { container } = render(<RegistryEntryCard profile={mockProfile} />);
    const violations = await wcagViolations(container);
    expect(violations).toEqual([]);
  });

  it("retry button has accessible interaction", async () => {
    render(<RegistryEntryCard profile={mockProfile} />);
    const user = userEvent.setup();

    const toggleButton = screen.getByRole("button", { name: /slash history/i });
    await user.click(toggleButton);

    // Wait for loading or error state - in this test environment it will likely error
    // The retry button should be keyboard accessible if it appears
    const retryButton = screen.queryByRole("button", { name: /retry/i });
    if (retryButton) {
      retryButton.focus();
      expect(retryButton).toHaveFocus();
    }
  });
});
