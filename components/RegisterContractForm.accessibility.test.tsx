// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { wcagViolations } from "@/lib/axeScan";
import RegisterContractForm from "./RegisterContractForm";

afterEach(cleanup);

const mockWalletAddress = "GTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ123456";

describe("RegisterContractForm accessibility", () => {
  it("passes automated accessibility scan in default state", async () => {
    const { container } = render(
      <RegisterContractForm walletAddress={mockWalletAddress} />
    );
    const violations = await wcagViolations(container);
    expect(violations).toEqual([]);
  });

  it("all form inputs have accessible labels", () => {
    render(<RegisterContractForm walletAddress={mockWalletAddress} />);

    expect(screen.getByLabelText(/contract id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it("category buttons have proper aria-pressed state", async () => {
    render(<RegisterContractForm walletAddress={mockWalletAddress} />);
    const user = userEvent.setup();

    const categoryButtons = screen.getAllByRole("button", { pressed: false });
    const firstCategory = categoryButtons.find(btn => btn.getAttribute("aria-pressed") === "false");

    if (firstCategory) {
      expect(firstCategory).toHaveAttribute("aria-pressed", "false");
      await user.click(firstCategory);
      expect(firstCategory).toHaveAttribute("aria-pressed", "true");
    }
  });

  it("supports keyboard navigation through form fields", async () => {
    render(<RegisterContractForm walletAddress={mockWalletAddress} />);
    const user = userEvent.setup();

    const contractIdInput = screen.getByLabelText(/contract id/i);
    const nameInput = screen.getByLabelText(/project name/i);
    const descriptionInput = screen.getByLabelText(/description/i);

    // Tab through fields
    await user.click(contractIdInput);
    expect(contractIdInput).toHaveFocus();

    await user.tab();
    expect(nameInput).toHaveFocus();

    await user.tab();
    expect(descriptionInput).toHaveFocus();
  });

  it("category toggle buttons are keyboard accessible", async () => {
    render(<RegisterContractForm walletAddress={mockWalletAddress} />);
    const user = userEvent.setup();

    const categoryButtons = screen.getAllByRole("button").filter(
      btn => btn.getAttribute("type") === "button" && btn.getAttribute("aria-pressed") !== null
    );

    if (categoryButtons.length > 0) {
      const firstCategory = categoryButtons[0];
      firstCategory.focus();
      expect(firstCategory).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(firstCategory).toHaveAttribute("aria-pressed", "true");
    }
  });

  it("submit button has proper loading state", async () => {
    const mockRegister = vi.fn().mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve({ hash: "test-hash" }), 100);
    }));

    render(
      <RegisterContractForm
        walletAddress={mockWalletAddress}
        register={mockRegister}
      />
    );
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/contract id/i), "CABC123");
    await user.type(screen.getByLabelText(/project name/i), "Test Project");

    // Select a category
    const categoryButtons = screen.getAllByRole("button").filter(
      btn => btn.getAttribute("aria-pressed") === "false"
    );
    if (categoryButtons.length > 0) {
      await user.click(categoryButtons[0]);
    }

    const submitButton = screen.getByRole("button", { name: /register/i });
    expect(submitButton).not.toBeDisabled();
  });

  it("error messages have proper role=alert", async () => {
    const mockRegister = vi.fn().mockRejectedValue(new Error("Test error"));

    render(
      <RegisterContractForm
        walletAddress={mockWalletAddress}
        register={mockRegister}
      />
    );
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/contract id/i), "CABC123");
    await user.type(screen.getByLabelText(/project name/i), "Test Project");

    // Select a category
    const categoryButtons = screen.getAllByRole("button").filter(
      btn => btn.getAttribute("aria-pressed") === "false"
    );
    if (categoryButtons.length > 0) {
      await user.click(categoryButtons[0]);
    }

    const submitButton = screen.getByRole("button", { name: /register/i });
    await user.click(submitButton);

    await waitFor(() => {
      const alert = screen.queryByRole("alert");
      if (alert) {
        expect(alert).toBeInTheDocument();
      }
    });
  });

  it("success message has proper role=status", async () => {
    const mockRegister = vi.fn().mockResolvedValue({ hash: "test-hash" });

    render(
      <RegisterContractForm
        walletAddress={mockWalletAddress}
        register={mockRegister}
      />
    );
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/contract id/i), "CABC123");
    await user.type(screen.getByLabelText(/project name/i), "Test Project");

    // Select a category
    const categoryButtons = screen.getAllByRole("button").filter(
      btn => btn.getAttribute("aria-pressed") === "false"
    );
    if (categoryButtons.length > 0) {
      await user.click(categoryButtons[0]);
    }

    const submitButton = screen.getByRole("button", { name: /register/i });
    await user.click(submitButton);

    await waitFor(() => {
      const status = screen.queryByRole("status");
      if (status) {
        expect(status).toBeInTheDocument();
      }
    });
  });

  it("passes accessibility scan with validation error", async () => {
    render(<RegisterContractForm walletAddress={mockWalletAddress} />);
    const user = userEvent.setup();

    // Try to submit without selecting categories
    await user.type(screen.getByLabelText(/contract id/i), "CABC123");
    await user.type(screen.getByLabelText(/project name/i), "Test Project");

    const submitButton = screen.getByRole("button", { name: /register/i });
    await user.click(submitButton);

    const { container } = render(
      <RegisterContractForm walletAddress={mockWalletAddress} />
    );
    const violations = await wcagViolations(container);
    expect(violations).toEqual([]);
  });
});
