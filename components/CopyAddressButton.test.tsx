// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import CopyAddressButton from "./CopyAddressButton";

const ADDRESS = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS";

let writeText: ReturnType<typeof vi.fn>;

beforeEach(() => {
  writeText = vi.fn(() => Promise.resolve());
  // jsdom exposes `navigator.clipboard` as a getter-only property, so it has
  // to be redefined rather than assigned.
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

/**
 * `fireEvent` rather than `userEvent` throughout: the component's confirmation
 * is on a 2s timer, and userEvent's own async scheduling deadlocks against
 * vitest's fake clock. A plain click is all this component needs anyway.
 */
const click = () => fireEvent.click(screen.getByRole("button"));
const label = () => screen.getByRole("button").textContent;

describe("CopyAddressButton", () => {
  it("copies the full address, not a truncated one", () => {
    render(<CopyAddressButton address={ADDRESS} />);
    click();

    expect(writeText).toHaveBeenCalledWith(ADDRESS);
  });

  it("confirms the copy, then reverts", () => {
    vi.useFakeTimers();
    render(<CopyAddressButton address={ADDRESS} />);

    expect(label()).toBe("Copy");
    click();
    expect(label()).toBe("Copied!");

    // The label has to reset, or a second copy gives no feedback at all.
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(label()).toBe("Copy");
  });

  it("can be copied again after reverting", () => {
    vi.useFakeTimers();
    render(<CopyAddressButton address={ADDRESS} />);

    click();
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    click();

    expect(writeText).toHaveBeenCalledTimes(2);
    expect(label()).toBe("Copied!");
  });

  it("holds the confirmation for the full two seconds", () => {
    vi.useFakeTimers();
    render(<CopyAddressButton address={ADDRESS} />);

    click();
    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(label()).toBe("Copied!");
  });
});
