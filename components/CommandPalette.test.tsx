// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { setLocale } from "@/lib/i18n";
import { NAV_ROUTES } from "@/lib/routes";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import CommandPalette from "./CommandPalette";

const PLACEHOLDER = "Search routes and actions...";
const LAST_ROUTE = NAV_ROUTES[NAV_ROUTES.length - 1].path;

beforeEach(() => {
  push.mockClear();
  // jsdom has no layout engine; the palette scrolls the highlighted row into view.
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  setLocale("en");
});

function openWithShortcut(init: KeyboardEventInit = { key: "k", ctrlKey: true }) {
  fireEvent.keyDown(window, init);
}

function input() {
  return screen.getByPlaceholderText(PLACEHOLDER) as HTMLInputElement;
}

function options() {
  return screen.queryAllByRole("option");
}

describe("CommandPalette", () => {
  it("stays closed until the shortcut is pressed", () => {
    render(<CommandPalette />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens with Ctrl+K and focuses the search field", () => {
    render(<CommandPalette />);
    openWithShortcut();

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(document.activeElement).toBe(input());
  });

  it("opens with Cmd+K", () => {
    render(<CommandPalette />);
    openWithShortcut({ key: "k", metaKey: true });

    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("does not open on a plain k", () => {
    render(<CommandPalette />);
    openWithShortcut({ key: "k" });

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("does not open while the user is typing in a field", () => {
    render(
      <>
        <input aria-label="field" />
        <CommandPalette />
      </>,
    );
    fireEvent.keyDown(screen.getByLabelText("field"), { key: "k", ctrlKey: true });

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("offers the search action followed by every nav route", () => {
    render(<CommandPalette />);
    openWithShortcut();

    expect(options()).toHaveLength(NAV_ROUTES.length + 1);
    expect(options()[0].textContent).toContain("Search Stellar addresses and transactions");
    expect(options()[1].textContent).toContain(NAV_ROUTES[0].label);
  });

  it("filters the list by label", () => {
    render(<CommandPalette />);
    openWithShortcut();
    fireEvent.change(input(), { target: { value: "stats" } });

    expect(options()).toHaveLength(1);
    expect(options()[0].textContent).toContain("Stats");
  });

  it("filters the list by description", () => {
    render(<CommandPalette />);
    openWithShortcut();
    fireEvent.change(input(), { target: { value: "memo" } });

    expect(options()).toHaveLength(1);
    expect(options()[0].textContent).toContain("Memo search");
  });

  it("says so when nothing matches", () => {
    render(<CommandPalette />);
    openWithShortcut();
    fireEvent.change(input(), { target: { value: "no-such-route" } });

    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.getByText("No results found")).toBeTruthy();
  });

  it("moves the highlight with ArrowDown and opens the highlighted route on Enter", () => {
    render(<CommandPalette />);
    openWithShortcut();

    fireEvent.keyDown(input(), { key: "ArrowDown" });
    expect(options()[1].getAttribute("aria-selected")).toBe("true");
    expect(options()[0].getAttribute("aria-selected")).toBe("false");

    fireEvent.keyDown(input(), { key: "Enter" });
    expect(push).toHaveBeenCalledWith(NAV_ROUTES[0].path);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens the search action when Enter is pressed on the first row", () => {
    render(<CommandPalette />);
    openWithShortcut();
    fireEvent.keyDown(input(), { key: "Enter" });

    expect(push).toHaveBeenCalledWith("/search");
  });

  it("does not move the highlight above the first row", () => {
    render(<CommandPalette />);
    openWithShortcut();
    fireEvent.keyDown(input(), { key: "ArrowUp" });
    fireEvent.keyDown(input(), { key: "ArrowUp" });

    expect(options()[0].getAttribute("aria-selected")).toBe("true");
  });

  it("does not move the highlight past the last row", () => {
    render(<CommandPalette />);
    openWithShortcut();
    for (let i = 0; i < NAV_ROUTES.length + 5; i++) {
      fireEvent.keyDown(input(), { key: "ArrowDown" });
    }

    expect(options()[NAV_ROUTES.length].getAttribute("aria-selected")).toBe("true");
    fireEvent.keyDown(input(), { key: "Enter" });
    expect(push).toHaveBeenCalledWith(LAST_ROUTE);
  });

  it("resets the highlight to the first row when the query changes", () => {
    render(<CommandPalette />);
    openWithShortcut();
    fireEvent.keyDown(input(), { key: "ArrowDown" });
    fireEvent.change(input(), { target: { value: "stats" } });

    expect(options()[0].getAttribute("aria-selected")).toBe("true");
  });

  it("highlights a row on hover and opens it on click", () => {
    render(<CommandPalette />);
    openWithShortcut();

    fireEvent.mouseEnter(options()[2]);
    expect(options()[2].getAttribute("aria-selected")).toBe("true");

    fireEvent.click(options()[2]);
    expect(push).toHaveBeenCalledWith(NAV_ROUTES[1].path);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes on Escape and clears the query the next time it opens", () => {
    render(<CommandPalette />);
    openWithShortcut();
    fireEvent.change(input(), { target: { value: "stats" } });
    fireEvent.keyDown(input(), { key: "Escape" });

    expect(screen.queryByRole("dialog")).toBeNull();

    openWithShortcut();
    expect(input().value).toBe("");
    expect(options()).toHaveLength(NAV_ROUTES.length + 1);
  });

  it("stays open when the panel is clicked and closes when the backdrop is", () => {
    render(<CommandPalette />);
    openWithShortcut();

    fireEvent.click(input());
    expect(screen.getByRole("dialog")).toBeTruthy();

    fireEvent.click(screen.getByRole("dialog"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("uses the German catalogue when the locale is German", () => {
    setLocale("de");
    render(<CommandPalette />);
    openWithShortcut();

    expect(screen.getByPlaceholderText("Routen und Aktionen suchen...")).toBeTruthy();
    expect(screen.getByText("Transaktionen")).toBeTruthy();
  });
});
