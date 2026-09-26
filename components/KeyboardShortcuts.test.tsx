// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import KeyboardShortcuts from "./KeyboardShortcuts";

beforeEach(() => {
  push.mockClear();
  window.localStorage.clear();
});
afterEach(cleanup);

describe("KeyboardShortcuts", () => {
  it("navigates on a g-then-letter sequence", () => {
    render(<KeyboardShortcuts />);
    fireEvent.keyDown(window, { key: "g" });
    fireEvent.keyDown(window, { key: "r" });
    expect(push).toHaveBeenCalledWith("/registry");
  });

  it("does not navigate on a lone letter", () => {
    render(<KeyboardShortcuts />);
    fireEvent.keyDown(window, { key: "r" });
    expect(push).not.toHaveBeenCalled();
  });

  it("leaves browser and assistive-technology modifier chords alone", () => {
    render(<KeyboardShortcuts />);
    fireEvent.keyDown(window, { key: "g", ctrlKey: true });
    fireEvent.keyDown(window, { key: "r" });
    fireEvent.keyDown(window, { key: "/", metaKey: true });
    fireEvent.keyDown(window, { key: "/", altKey: true });
    expect(push).not.toHaveBeenCalled();
  });

  it("ignores keys typed into a field", () => {
    render(
      <>
        <input aria-label="field" />
        <KeyboardShortcuts />
      </>
    );
    const field = screen.getByLabelText("field");
    fireEvent.keyDown(field, { key: "g" });
    fireEvent.keyDown(field, { key: "r" });
    expect(push).not.toHaveBeenCalled();
  });

  it("focuses the page's search field on /", () => {
    render(
      <>
        <input aria-label="search" data-shortcut-search />
        <KeyboardShortcuts />
      </>
    );
    fireEvent.keyDown(window, { key: "/" });
    expect(document.activeElement).toBe(screen.getByLabelText("search"));
  });

  it("goes to the explorer on / when the page has no search field", () => {
    render(<KeyboardShortcuts />);
    fireEvent.keyDown(window, { key: "/" });
    expect(push).toHaveBeenCalledWith("/explorer");
  });

  it("lists the shortcuts in a dialog and closes on Escape", () => {
    render(<KeyboardShortcuts />);
    fireEvent.keyDown(window, { key: "?" });
    expect(screen.getByRole("dialog", { name: /keyboard shortcuts/i })).toBeTruthy();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("stops handling keys once the user disables shortcuts", () => {
    render(<KeyboardShortcuts />);
    fireEvent.click(screen.getByRole("button", { name: /keyboard shortcuts/i }));
    fireEvent.click(screen.getByLabelText(/enable keyboard shortcuts/i));
    fireEvent.keyDown(window, { key: "g" });
    fireEvent.keyDown(window, { key: "r" });
    expect(push).not.toHaveBeenCalled();
  });
});
