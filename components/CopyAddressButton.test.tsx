// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import CopyAddressButton from "./CopyAddressButton";

const ADDRESS = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS";

let writeText: ReturnType<typeof vi.fn>;

function defineClipboard(impl: { writeText: ReturnType<typeof vi.fn> } | null) {
  Object.defineProperty(navigator, "clipboard", {
    value: impl,
    configurable: true,
    writable: true,
  });
}

beforeEach(() => {
  writeText = vi.fn(() => Promise.resolve());
  defineClipboard({ writeText });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/**
 * `fireEvent` rather than `userEvent` throughout: the component's confirmation
 * is on a 2s timer, and userEvent's own async scheduling deadlocks against
 * vitest's fake clock. A plain click is all this component needs anyway.
 */
const click = () => fireEvent.click(screen.getByRole("button"));
const label = () => screen.getByRole("button").textContent;

describe("CopyAddressButton", () => {
  it("copies the full address, not a truncated one", async () => {
    render(<CopyAddressButton address={ADDRESS} />);
    await act(async () => { click(); });

    expect(writeText).toHaveBeenCalledWith(ADDRESS);
  });

  it("confirms the copy, then reverts", async () => {
    vi.useFakeTimers();
    render(<CopyAddressButton address={ADDRESS} />);

    expect(label()).toBe("Copy");
    await act(async () => { click(); });
    expect(label()).toBe("Copied!");

    act(() => { vi.advanceTimersByTime(2000); });
    expect(label()).toBe("Copy");
  });

  it("can be copied again after reverting", async () => {
    vi.useFakeTimers();
    render(<CopyAddressButton address={ADDRESS} />);

    await act(async () => { click(); });
    act(() => { vi.advanceTimersByTime(2000); });
    await act(async () => { click(); });

    expect(writeText).toHaveBeenCalledTimes(2);
    expect(label()).toBe("Copied!");
  });

  it("holds the confirmation for the full two seconds", async () => {
    vi.useFakeTimers();
    render(<CopyAddressButton address={ADDRESS} />);

    await act(async () => { click(); });
    act(() => { vi.advanceTimersByTime(1999); });
    expect(label()).toBe("Copied!");
  });

  describe("failure handling", () => {
    it("shows 'Failed' when clipboard API rejects", async () => {
      writeText.mockRejectedValueOnce(new Error("NotAllowedError"));
      // Also disable execCommand fallback so there is no silent rescue
      vi.spyOn(document, "execCommand").mockReturnValue(false);

      render(<CopyAddressButton address={ADDRESS} />);
      await act(async () => { click(); });

      expect(label()).toBe("Failed");
    });

    it("never shows 'Copied!' when clipboard API rejects", async () => {
      writeText.mockRejectedValueOnce(new Error("NotAllowedError"));
      vi.spyOn(document, "execCommand").mockReturnValue(false);

      render(<CopyAddressButton address={ADDRESS} />);
      await act(async () => { click(); });

      expect(label()).not.toBe("Copied!");
    });

    it("reverts from 'Failed' back to 'Copy' after two seconds", async () => {
      vi.useFakeTimers();
      writeText.mockRejectedValueOnce(new Error("NotAllowedError"));
      vi.spyOn(document, "execCommand").mockReturnValue(false);

      render(<CopyAddressButton address={ADDRESS} />);
      await act(async () => { click(); });
      expect(label()).toBe("Failed");

      act(() => { vi.advanceTimersByTime(2000); });
      expect(label()).toBe("Copy");
    });
  });

  describe("execCommand fallback (insecure context)", () => {
    beforeEach(() => {
      // Simulate absence of Clipboard API (plain HTTP / insecure context)
      defineClipboard(null);
    });

    it("falls back to execCommand and shows 'Copied!' on success", async () => {
      const execCommand = vi.spyOn(document, "execCommand").mockReturnValue(true);

      render(<CopyAddressButton address={ADDRESS} />);
      await act(async () => { click(); });

      expect(execCommand).toHaveBeenCalledWith("copy");
      expect(label()).toBe("Copied!");
    });

    it("shows 'Failed' when execCommand also fails", async () => {
      vi.spyOn(document, "execCommand").mockReturnValue(false);

      render(<CopyAddressButton address={ADDRESS} />);
      await act(async () => { click(); });

      expect(label()).toBe("Failed");
    });
  });
});
