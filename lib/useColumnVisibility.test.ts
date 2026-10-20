import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useColumnVisibility } from "./useColumnVisibility";

describe("useColumnVisibility", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it("initializes with all columns visible by default", () => {
    const columns = ["date", "type", "amount"];
    const { result } = renderHook(() =>
      useColumnVisibility("test-table", columns)
    );

    expect(result.current.visibleColumns).toEqual(columns);
    expect(result.current.visibleCount).toBe(3);
    expect(result.current.isVisible("date")).toBe(true);
    expect(result.current.isVisible("amount")).toBe(true);
  });

  it("initializes with custom default visible columns", () => {
    const columns = ["date", "type", "amount", "status"];
    const defaultVisible = ["date", "amount"];

    const { result } = renderHook(() =>
      useColumnVisibility("test-table", columns, defaultVisible)
    );

    expect(result.current.visibleColumns).toEqual(defaultVisible);
    expect(result.current.visibleCount).toBe(2);
    expect(result.current.isVisible("date")).toBe(true);
    expect(result.current.isVisible("type")).toBe(false);
  });

  it("toggles column visibility", () => {
    const columns = ["date", "type", "amount"];
    const { result } = renderHook(() =>
      useColumnVisibility("test-table", columns)
    );

    act(() => {
      result.current.toggleColumn("type");
    });

    expect(result.current.isVisible("type")).toBe(false);
    expect(result.current.visibleCount).toBe(2);

    act(() => {
      result.current.toggleColumn("type");
    });

    expect(result.current.isVisible("type")).toBe(true);
    expect(result.current.visibleCount).toBe(3);
  });

  it("prevents hiding the last visible column", () => {
    const columns = ["date", "type", "amount"];
    const { result } = renderHook(() =>
      useColumnVisibility("test-table", columns)
    );

    // Hide all but one
    act(() => {
      result.current.toggleColumn("type");
      result.current.toggleColumn("amount");
    });

    expect(result.current.visibleCount).toBe(1);

    // Try to hide the last column
    act(() => {
      result.current.toggleColumn("date");
    });

    // Should still be visible
    expect(result.current.isVisible("date")).toBe(true);
    expect(result.current.visibleCount).toBe(1);
  });

  it("persists state to localStorage", () => {
    const columns = ["date", "type", "amount"];
    const { result } = renderHook(() =>
      useColumnVisibility("test-table", columns)
    );

    act(() => {
      result.current.toggleColumn("type");
    });

    const stored = localStorage.getItem("lumina-column-visibility-test-table");
    expect(stored).toBeDefined();

    const parsed = JSON.parse(stored!);
    expect(parsed).toEqual(["date", "amount"]);
  });

  it("restores state from localStorage", () => {
    const columns = ["date", "type", "amount"];

    // Pre-populate localStorage
    localStorage.setItem(
      "lumina-column-visibility-test-table",
      JSON.stringify(["date"])
    );

    const { result } = renderHook(() =>
      useColumnVisibility("test-table", columns)
    );

    expect(result.current.visibleColumns).toEqual(["date"]);
    expect(result.current.visibleCount).toBe(1);
  });

  it("resets to defaults", () => {
    const columns = ["date", "type", "amount"];
    const defaultVisible = ["date", "type"];

    const { result } = renderHook(() =>
      useColumnVisibility("test-table", columns, defaultVisible)
    );

    // Change visibility
    act(() => {
      result.current.toggleColumn("type");
      result.current.toggleColumn("amount");
    });

    expect(result.current.visibleColumns).toEqual(["date", "amount"]);

    // Reset to defaults
    act(() => {
      result.current.resetToDefaults();
    });

    expect(result.current.visibleColumns).toEqual(defaultVisible);
  });

  it("handles invalid stored data gracefully", () => {
    const columns = ["date", "type", "amount"];

    // Store invalid data
    localStorage.setItem(
      "lumina-column-visibility-test-table",
      "invalid json"
    );

    const { result } = renderHook(() =>
      useColumnVisibility("test-table", columns)
    );

    // Should fall back to defaults
    expect(result.current.visibleColumns).toEqual(columns);
  });

  it("validates stored columns against current column list", () => {
    const columns = ["date", "type", "amount"];

    // Store data with columns that no longer exist
    localStorage.setItem(
      "lumina-column-visibility-test-table",
      JSON.stringify(["date", "oldColumn", "removedColumn"])
    );

    const { result } = renderHook(() =>
      useColumnVisibility("test-table", columns)
    );

    // Should only include valid columns
    expect(result.current.visibleColumns).toEqual(["date"]);
  });
});
