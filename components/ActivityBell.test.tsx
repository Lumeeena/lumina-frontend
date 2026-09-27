// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import ActivityBell from "./ActivityBell";
import {
  NOTIFICATIONS_STORAGE_KEY,
  __resetNotificationStore,
  getSnapshot,
  recordActivity,
} from "@/lib/notifications";
import type { Operation } from "@/lib/types";

function op(overrides: Partial<Operation> = {}): Operation {
  return {
    id: "op-1",
    type: "PAYMENT",
    createdAt: "2026-03-01T12:00:00Z",
    transactionHash: "b".repeat(64),
    sourceAccount: "GA",
    from: "GA",
    to: "GB",
    amount: "100",
    asset: null,
    ...overrides,
  } as Operation;
}

/** Seed the store as if the layout's watcher had just recorded an alert. */
function seed(...operations: Operation[]) {
  for (const operation of operations) recordActivity("GA", operation);
}

beforeEach(() => {
  localStorage.clear();
  __resetNotificationStore();
});

afterEach(cleanup);

describe("ActivityBell", () => {
  it("shows no badge when there is nothing to report", () => {
    render(<ActivityBell />);

    expect(screen.getByTestId("activity-bell")).toBeTruthy();
    expect(screen.queryByTestId("activity-bell-count")).toBeNull();
    expect(screen.getByTestId("activity-bell").getAttribute("aria-label")).toBe(
      "Watched address alerts",
    );
  });

  it("increments the indicator as new activity arrives", () => {
    // The first acceptance criterion for #81.
    render(<ActivityBell />);
    expect(screen.queryByTestId("activity-bell-count")).toBeNull();

    // `act` because the store notifies outside React, exactly as the layout's
    // watcher does when a subscription delivers.
    act(() => seed(op({ id: "a" })));
    expect(screen.getByTestId("activity-bell-count").textContent).toBe("1");

    act(() => seed(op({ id: "b" }), op({ id: "c" })));
    expect(screen.getByTestId("activity-bell-count").textContent).toBe("3");
  });

  it("does not count a duplicate delivery twice", () => {
    // The server replays every subscription after a reconnect, so a repeat is
    // the normal case rather than an edge case.
    render(<ActivityBell />);
    act(() => {
      seed(op({ id: "a" }));
      seed(op({ id: "a" }));
    });

    expect(screen.getByTestId("activity-bell-count").textContent).toBe("1");
  });

  it("marks items read when the panel is opened", () => {
    // The second acceptance criterion for #81.
    seed(op({ id: "a" }), op({ id: "b" }));
    render(<ActivityBell />);

    fireEvent.click(screen.getByTestId("activity-bell"));

    expect(screen.getByTestId("activity-panel")).toBeTruthy();
    expect(screen.getAllByTestId("activity-notification")).toHaveLength(2);
    expect(screen.queryByTestId("activity-bell-count")).toBeNull();
    expect(getSnapshot().every((item) => item.read)).toBe(true);
  });

  it("keeps items read when the panel is closed and reopened", () => {
    // Reading happens on open and is not undone on close — otherwise closing
    // the tray would resurrect every alert in the badge.
    seed(op({ id: "a" }));
    render(<ActivityBell />);

    fireEvent.click(screen.getByTestId("activity-bell"));
    fireEvent.click(screen.getByTestId("activity-bell"));
    expect(screen.queryByTestId("activity-panel")).toBeNull();

    fireEvent.click(screen.getByTestId("activity-bell"));
    expect(screen.getAllByTestId("activity-notification")).toHaveLength(1);
    expect(screen.queryByTestId("activity-bell-count")).toBeNull();
  });

  it("clears the tray, and closes the panel", () => {
    seed(op({ id: "a" }), op({ id: "b" }));
    render(<ActivityBell />);
    fireEvent.click(screen.getByTestId("activity-bell"));

    fireEvent.click(screen.getByRole("button", { name: "Clear all" }));

    expect(screen.queryByTestId("activity-panel")).toBeNull();
    expect(getSnapshot()).toEqual([]);
    expect(screen.queryByTestId("activity-bell-count")).toBeNull();
  });

  it("says so when the tray is empty, rather than showing an empty box", () => {
    render(<ActivityBell />);
    fireEvent.click(screen.getByTestId("activity-bell"));

    expect(screen.getByTestId("activity-panel").textContent).toMatch(/nothing yet/i);
    expect(screen.queryByRole("button", { name: "Clear all" })).toBeNull();
  });

  it("links each alert to the account it came from", () => {
    seed(op({ id: "a" }));
    render(<ActivityBell />);
    fireEvent.click(screen.getByTestId("activity-bell"));

    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/accounts/GA");
  });

  it("announces the count, so it is not a coloured dot with a number in it", () => {
    seed(op({ id: "a" }));
    render(<ActivityBell />);

    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.textContent).toBe("1 unread watched alert");
  });

  it("closes on Escape", () => {
    seed(op({ id: "a" }));
    render(<ActivityBell />);
    fireEvent.click(screen.getByTestId("activity-bell"));

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByTestId("activity-panel")).toBeNull();
  });

  it("survives a corrupt stored value", () => {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, "{not json");
    __resetNotificationStore();
    render(<ActivityBell />);

    expect(screen.getByTestId("activity-bell")).toBeTruthy();
    expect(screen.queryByTestId("activity-bell-count")).toBeNull();
  });
});
