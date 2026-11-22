// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WATCHES_STORAGE_KEY } from "@/lib/watches";
import WatchIndicator from "./WatchIndicator";

const ADDRESS = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS";

beforeEach(() => {
  localStorage.clear();
});

afterEach(cleanup);

describe("WatchIndicator", () => {
  it("renders a button with the correct accessible name for unwatched address", () => {
    render(<WatchIndicator address={ADDRESS} />);

    const button = screen.getByRole("button", { name: `Watch ${ADDRESS}` });
    expect(button).toBeInTheDocument();
  });

  it("renders a button with aria-pressed false when address is not watched", () => {
    render(<WatchIndicator address={ADDRESS} />);

    const button = screen.getByRole("button", { name: `Watch ${ADDRESS}` });
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("renders a button with the correct accessible name for watched address", () => {
    // Pre-populate localStorage with the address as watched
    localStorage.setItem(
      WATCHES_STORAGE_KEY,
      JSON.stringify([{ address: ADDRESS, filters: { operationType: "PAYMENT", minAmount: null, asset: "" } }]),
    );

    render(<WatchIndicator address={ADDRESS} />);

    const button = screen.getByRole("button", { name: `Unwatch ${ADDRESS}` });
    expect(button).toBeInTheDocument();
  });

  it("renders a button with aria-pressed true when address is watched", () => {
    localStorage.setItem(
      WATCHES_STORAGE_KEY,
      JSON.stringify([{ address: ADDRESS, filters: { operationType: "PAYMENT", minAmount: null, asset: "" } }]),
    );

    render(<WatchIndicator address={ADDRESS} />);

    const button = screen.getByRole("button", { name: `Unwatch ${ADDRESS}` });
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("has correct title attribute for unwatched address", () => {
    render(<WatchIndicator address={ADDRESS} />);

    const button = screen.getByRole("button", { name: `Watch ${ADDRESS}` });
    expect(button).toHaveAttribute("title", "Add to watch list");
  });

  it("has correct title attribute for watched address", () => {
    localStorage.setItem(
      WATCHES_STORAGE_KEY,
      JSON.stringify([{ address: ADDRESS, filters: { operationType: "PAYMENT", minAmount: null, asset: "" } }]),
    );

    render(<WatchIndicator address={ADDRESS} />);

    const button = screen.getByRole("button", { name: `Unwatch ${ADDRESS}` });
    expect(button).toHaveAttribute("title", "Remove from watch list");
  });

  it("toggles from unwatched to watched when clicked", async () => {
    const user = userEvent.setup();
    render(<WatchIndicator address={ADDRESS} />);

    const button = screen.getByRole("button", { name: `Watch ${ADDRESS}` });
    expect(button).toHaveAttribute("aria-pressed", "false");

    await user.click(button);

    // The component updates localStorage via toggleWatch
    // Verify the address was added to storage
    const stored = JSON.parse(localStorage.getItem(WATCHES_STORAGE_KEY) || "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].address).toBe(ADDRESS);
  });

  it("toggles from watched to unwatched when clicked", async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      WATCHES_STORAGE_KEY,
      JSON.stringify([{ address: ADDRESS, filters: { operationType: "PAYMENT", minAmount: null, asset: "" } }]),
    );

    render(<WatchIndicator address={ADDRESS} />);

    const button = screen.getByRole("button", { name: `Unwatch ${ADDRESS}` });
    expect(button).toHaveAttribute("aria-pressed", "true");

    await user.click(button);

    // After clicking, the address should be removed from localStorage
    const stored = JSON.parse(localStorage.getItem(WATCHES_STORAGE_KEY) || "[]");
    expect(stored).toEqual([]);
  });

  it("prevents click event from bubbling to parent", async () => {
    const user = userEvent.setup();
    const parentClickHandler = vi.fn();

    render(
      <div onClick={parentClickHandler}>
        <WatchIndicator address={ADDRESS} />
      </div>,
    );

    const button = screen.getByRole("button", { name: `Watch ${ADDRESS}` });
    await user.click(button);

    // The parent click handler should not be called because stopPropagation is used
    expect(parentClickHandler).not.toHaveBeenCalled();
  });

  it("can receive keyboard focus via tab", async () => {
    const user = userEvent.setup();
    render(<WatchIndicator address={ADDRESS} />);

    await user.tab();

    const button = screen.getByRole("button", { name: `Watch ${ADDRESS}` });
    expect(document.activeElement).toBe(button);
  });
});
