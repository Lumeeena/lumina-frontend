// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTimezone } from "./useTimezone";

const STORAGE_KEY = "lumina-timezone";

describe("useTimezone", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("defaults to the system timezone when nothing is stored", () => {
    const { result } = renderHook(() => useTimezone());

    expect(result.current.timezone).toBe("system");
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("restores a stored UTC preference", () => {
    localStorage.setItem(STORAGE_KEY, "UTC");

    const { result } = renderHook(() => useTimezone());

    expect(result.current.timezone).toBe("UTC");
  });

  it("falls back to system for an unrecognised stored value", () => {
    localStorage.setItem(STORAGE_KEY, "America/New_York");

    const { result } = renderHook(() => useTimezone());

    expect(result.current.timezone).toBe("system");
  });

  it("setTimezone('UTC') updates state and persists the choice", () => {
    const { result } = renderHook(() => useTimezone());

    act(() => {
      result.current.setTimezone("UTC");
    });

    expect(result.current.timezone).toBe("UTC");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("UTC");
  });

  it("setTimezone('system') removes the stored key", () => {
    localStorage.setItem(STORAGE_KEY, "UTC");
    const { result } = renderHook(() => useTimezone());

    act(() => {
      result.current.setTimezone("system");
    });

    expect(result.current.timezone).toBe("system");
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("a preference set by one hook instance is read back by a fresh one", () => {
    const first = renderHook(() => useTimezone());
    act(() => {
      first.result.current.setTimezone("UTC");
    });
    first.unmount();

    const second = renderHook(() => useTimezone());

    expect(second.result.current.timezone).toBe("UTC");
  });
});
