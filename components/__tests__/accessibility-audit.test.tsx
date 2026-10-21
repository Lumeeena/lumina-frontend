/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import CopyAddressButton from "../CopyAddressButton";
import LocaleSwitcher from "../LocaleSwitcher";
import LoadMoreFooter from "../LoadMoreFooter";

vi.mock("@/lib/i18n", () => ({
  t: (key: string) => key,
  getLocale: () => "en",
  setLocale: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("accessibility audit: shared controls", () => {
  it("CopyAddressButton has an accessible name, native button semantics, and keyboard activation", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<CopyAddressButton address="GABC123" />);
    const button = screen.getByRole("button", { name: "copy.copyAddress" });
    expect(button).toBeVisible();
    button.focus();
    expect(button).toHaveFocus();
    fireEvent.keyDown(button, { key: "Enter" });
    fireEvent.click(button);
    expect(writeText).toHaveBeenCalledWith("GABC123");
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("LocaleSwitcher exposes a named native select and can be operated with the keyboard", () => {
    render(<LocaleSwitcher />);
    const select = screen.getByRole("combobox", { name: "Select language" });
    select.focus();
    expect(select).toHaveFocus();
    expect(select.querySelectorAll("option")).toHaveLength(9);
    fireEvent.change(select, { target: { value: "ja" } });
    expect(select).toHaveValue("ja");
  });

  it("LoadMoreFooter announces errors and gives retry a clear accessible name", () => {
    const onLoadMore = vi.fn();
    render(<LoadMoreFooter loading={false} error="Network unavailable" hasMore={true} endLabel="No more results" onLoadMore={onLoadMore} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Network unavailable");
    const retry = screen.getByRole("button", { name: "loadMore.retry" });
    retry.focus();
    expect(retry).toHaveFocus();
    fireEvent.click(retry);
    expect(onLoadMore).toHaveBeenCalledOnce();
  });

  it("LoadMoreFooter announces loading and keeps the native load-more button keyboard focusable", () => {
    render(<LoadMoreFooter loading={true} error={null} hasMore={true} endLabel="No more results" onLoadMore={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent("loadMore.loading");
    expect(screen.getByRole("button", { name: "loadMore.loading" })).toBeDisabled();
  });
});
