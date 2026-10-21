// @vitest-environment jsdom
import { act } from "@testing-library/react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import TimeAgo from "./TimeAgo";
import ContractStorageKeyHistory from "./ContractStorageKeyHistory";
import { setLocale } from "@/lib/i18n";

let root: Root | undefined;
afterEach(async () => {
  if (root) await act(async () => root?.unmount());
  root = undefined;
  vi.useRealTimers();
  setLocale("en");
});

describe("time-dependent route content hydration", () => {
  it("hydrates a populated transaction timestamp despite server/client clock and locale differences", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const content = <TimeAgo isoString="2025-12-31T23:59:59Z" />;
    const container = document.createElement("div");
    container.innerHTML = renderToString(content);
    expect(container.textContent).toBe("2025-12-31T23:59:59Z");
    vi.setSystemTime(new Date("2026-01-01T00:02:00Z"));
    setLocale("de");
    const errors: unknown[] = [];
    await act(async () => {
      root = hydrateRoot(container, content, {
        onRecoverableError: (error) => errors.push(error),
      });
    });
    expect(errors).toEqual([]);
    expect(container.textContent).toMatch(/min/i);
    expect(container.querySelector("time")?.title).toContain(
      "your local timezone",
    );
  });

  it("does not invent a current storage timestamp that changes between server and browser", async () => {
    const content = (
      <ContractStorageKeyHistory
        contractId="C1"
        storageKey="key"
        currentValue="value"
        currentLedger={10}
        hasCompleteHistory={false}
        history={[]}
      />
    );
    const container = document.createElement("div");
    container.innerHTML = renderToString(content);
    const errors: unknown[] = [];
    await act(async () => {
      root = hydrateRoot(container, content, {
        onRecoverableError: (error) => errors.push(error),
      });
    });
    expect(errors).toEqual([]);
    expect(container.textContent).toContain("Current value");
    expect(container.querySelector("time")).toBeNull();
  });
});
