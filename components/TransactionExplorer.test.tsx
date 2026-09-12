// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { Transaction } from "@/lib/types";
import { PRESETS_STORAGE_KEY } from "@/lib/filterPresets";

const mocks = vi.hoisted(() => ({
  gqlFetch: vi.fn(),
  replace: vi.fn(),
  searchParams: new URLSearchParams(),
}));

vi.mock("@/lib/graphql", () => ({
  gqlFetch: mocks.gqlFetch,
  GRAPHQL_URL: "http://test/graphql",
  PUBLIC_GRAPHQL_URL: "http://test/graphql",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, push: vi.fn() }),
  usePathname: () => "/transactions",
  useSearchParams: () => mocks.searchParams,
}));

import TransactionExplorer, { PAGE_SIZE } from "./TransactionExplorer";

function tx(n: number, overrides: Partial<Transaction> = {}): Transaction {
  return {
    hash: `hash${String(n).padStart(5, "0")}`,
    ledger: 1000 + n,
    createdAt: `2026-03-${String((n % 28) + 1).padStart(2, "0")}T12:00:00Z`,
    sourceAccount: `GSOURCE${String(n).padStart(4, "0")}`,
    feeCharged: "1000000",
    operationCount: 1,
    successful: true,
    memoType: null,
    memo: null,
    ...overrides,
  };
}

/** A page response in the shape the schema actually returns. */
function page(items: Transaction[], cursor: string | null, hasNextPage = cursor !== null) {
  return { transactions: { items, pageInfo: { hasNextPage, cursor } } };
}

function rowHashes(): string[] {
  const scroll = screen.getByTestId("transaction-scroll");
  return within(scroll)
    .queryAllByRole("link")
    .map(a => a.getAttribute("title") ?? "")
    .filter(Boolean);
}

beforeEach(() => {
  mocks.gqlFetch.mockReset();
  mocks.replace.mockReset();
  mocks.searchParams = new URLSearchParams();
  localStorage.clear();

  // jsdom gives every element a zero-sized box, which would leave the
  // virtualizer with no visible window at all — it reads `offsetHeight`, so
  // stubbing only `getBoundingClientRect` renders zero rows.
  Object.defineProperty(HTMLElement.prototype, "clientHeight", { configurable: true, value: 800 });
  Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, value: 900 });
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, value: 800 });
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", { configurable: true, value: 900 });
  HTMLElement.prototype.getBoundingClientRect = () =>
    ({ width: 900, height: 800, top: 0, left: 0, right: 900, bottom: 800, x: 0, y: 0, toJSON: () => {} }) as DOMRect;

  // Neither observer exists in jsdom; the component treats an absent
  // IntersectionObserver as "use the Load more button".
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function renderExplorer() {
  await act(async () => {
    render(<TransactionExplorer />);
  });
}

describe("TransactionExplorer pagination", () => {
  it("requests the first page with no cursor", async () => {
    mocks.gqlFetch.mockResolvedValue(page([tx(1)], "cursor-1"));
    await renderExplorer();

    expect(mocks.gqlFetch).toHaveBeenCalledTimes(1);
    expect(mocks.gqlFetch.mock.calls[0][2]).toEqual({ limit: PAGE_SIZE, cursor: null });
  });

  it("uses the API's real cursor for the next page rather than a bigger limit", async () => {
    mocks.gqlFetch
      .mockResolvedValueOnce(page([tx(1), tx(2)], "cursor-1"))
      .mockResolvedValueOnce(page([tx(3)], null, false));

    await renderExplorer();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /load more/i }));
    });

    // This is the whole point of the issue: page two comes from the cursor.
    expect(mocks.gqlFetch.mock.calls[1][2]).toEqual({ limit: PAGE_SIZE, cursor: "cursor-1" });
    expect(rowHashes()).toEqual([tx(1).hash, tx(2).hash, tx(3).hash]);
  });

  it("stops offering more once the API says there is no next page", async () => {
    mocks.gqlFetch.mockResolvedValue(page([tx(1)], null, false));
    await renderExplorer();

    expect(screen.queryByRole("button", { name: /load more/i })).toBeNull();
    expect(screen.getByText("End of results")).toBeTruthy();
  });

  it("drops rows a cursor page repeats, so keys stay unique", async () => {
    mocks.gqlFetch
      .mockResolvedValueOnce(page([tx(1), tx(2)], "cursor-1"))
      // New transactions arriving between requests can shift a page window.
      .mockResolvedValueOnce(page([tx(2), tx(3)], null, false));

    await renderExplorer();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /load more/i }));
    });

    expect(rowHashes()).toEqual([tx(1).hash, tx(2).hash, tx(3).hash]);
  });

  it("surfaces a failed page with a retry instead of looping", async () => {
    mocks.gqlFetch.mockRejectedValueOnce(new Error("network"));
    await renderExplorer();

    expect(screen.getByText(/could not load more/i)).toBeTruthy();

    mocks.gqlFetch.mockResolvedValueOnce(page([tx(1)], null, false));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    });

    expect(rowHashes()).toEqual([tx(1).hash]);
  });
});

describe("TransactionExplorer filtering", () => {
  it("reads its filters from the URL on first render", async () => {
    mocks.searchParams = new URLSearchParams("status=failed");
    mocks.gqlFetch.mockResolvedValue(
      page([tx(1, { successful: true }), tx(2, { successful: false })], null, false),
    );

    await renderExplorer();

    expect(rowHashes()).toEqual([tx(2).hash]);
    expect(screen.getByTestId("result-count").textContent).toBe("1 of 2 loaded");
  });

  it("writes a filter change to the URL so the view is shareable", async () => {
    mocks.gqlFetch.mockResolvedValue(page([tx(1)], null, false));
    await renderExplorer();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "failed" }));
    });

    expect(mocks.replace).toHaveBeenCalledWith("/transactions?status=failed", { scroll: false });
  });

  it("clears back to a bare path rather than an empty query string", async () => {
    mocks.searchParams = new URLSearchParams("status=failed");
    mocks.gqlFetch.mockResolvedValue(page([tx(1, { successful: false })], null, false));
    await renderExplorer();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /clear 1 filter/i }));
    });

    expect(mocks.replace).toHaveBeenCalledWith("/transactions", { scroll: false });
  });

  it("keeps pulling pages when a filter leaves too few matches to show", async () => {
    // Page one is all successes, so a "failed" filter matches nothing in it.
    mocks.searchParams = new URLSearchParams("status=failed");
    mocks.gqlFetch
      .mockResolvedValueOnce(page([tx(1), tx(2)], "cursor-1"))
      .mockResolvedValueOnce(page([tx(3, { successful: false })], null, false));

    await renderExplorer();

    // Without the chase this shows "no matches" while page two is full of
    // them, which reads as "no results" rather than "not loaded yet".
    await waitFor(() => expect(rowHashes()).toEqual([tx(3).hash]));
  });

  it("gives up chasing rather than walking the whole chain for a filter that matches nothing", async () => {
    mocks.searchParams = new URLSearchParams("source=NOTHINGMATCHESTHIS");
    mocks.gqlFetch.mockImplementation(async () => page([tx(Math.random())], "more"));

    await renderExplorer();

    await waitFor(() => expect(mocks.gqlFetch.mock.calls.length).toBeGreaterThan(1));
    // Bounded: the first page plus a capped number of auto-loads.
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(mocks.gqlFetch.mock.calls.length).toBeLessThanOrEqual(7);
  });

  it("says the filters matched nothing, not that nothing is indexed", async () => {
    mocks.searchParams = new URLSearchParams("status=failed");
    mocks.gqlFetch.mockResolvedValue(page([tx(1, { successful: true })], null, false));

    await renderExplorer();

    expect(screen.getByText(/no transactions match these filters/i)).toBeTruthy();
  });
});

describe("TransactionExplorer presets", () => {
  it("saves a named preset and offers it back", async () => {
    mocks.searchParams = new URLSearchParams("status=failed");
    mocks.gqlFetch.mockResolvedValue(page([tx(1, { successful: false })], null, false));
    await renderExplorer();

    await act(async () => {
      fireEvent.change(screen.getByLabelText("Preset name"), { target: { value: "My failures" } });
      fireEvent.click(screen.getByRole("button", { name: /save preset/i }));
    });

    expect(screen.getByRole("button", { name: "My failures" })).toBeTruthy();
    // And it is in storage, so it is there on the next visit.
    expect(localStorage.getItem(PRESETS_STORAGE_KEY)).toContain("My failures");
  });

  it("loads presets saved in a previous session", async () => {
    localStorage.setItem(
      PRESETS_STORAGE_KEY,
      JSON.stringify([{ name: "Big batches", query: "minOps=5" }]),
    );
    mocks.gqlFetch.mockResolvedValue(page([tx(1)], null, false));

    await renderExplorer();

    expect(screen.getByRole("button", { name: "Big batches" })).toBeTruthy();
  });

  it("applying a preset puts its filters in the URL", async () => {
    localStorage.setItem(
      PRESETS_STORAGE_KEY,
      JSON.stringify([{ name: "Big batches", query: "minOps=5" }]),
    );
    mocks.gqlFetch.mockResolvedValue(page([tx(1)], null, false));
    await renderExplorer();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Big batches" }));
    });

    expect(mocks.replace).toHaveBeenCalledWith("/transactions?minOps=5", { scroll: false });
  });

  it("deletes a preset", async () => {
    localStorage.setItem(
      PRESETS_STORAGE_KEY,
      JSON.stringify([{ name: "Doomed", query: "status=failed" }]),
    );
    mocks.gqlFetch.mockResolvedValue(page([tx(1)], null, false));
    await renderExplorer();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Delete preset Doomed" }));
    });

    expect(screen.queryByRole("button", { name: "Doomed" })).toBeNull();
  });
});

describe("TransactionExplorer virtualization", () => {
  it("renders a window of rows rather than the whole loaded set", async () => {
    const many = Array.from({ length: 400 }, (_, i) => tx(i));
    mocks.gqlFetch.mockResolvedValue(page(many, null, false));

    await renderExplorer();

    const rendered = rowHashes();
    expect(rendered.length).toBeGreaterThan(0);
    // The point of virtualizing: the DOM holds a viewport's worth, not 400.
    expect(rendered.length).toBeLessThan(many.length);
    expect(screen.getByTestId("result-count").textContent).toBe("400 loaded");
  });

  it("reserves the height of the rows it is not rendering, so nothing is lost", async () => {
    const many = Array.from({ length: 400 }, (_, i) => tx(i));
    mocks.gqlFetch.mockResolvedValue(page(many, null, false));

    await renderExplorer();

    const spacers = screen
      .getByTestId("transaction-scroll")
      .querySelectorAll('tr[aria-hidden="true"] > td');
    const reserved = Array.from(spacers).reduce(
      (total, cell) => total + parseFloat((cell as HTMLElement).style.height || "0"),
      0,
    );
    const renderedHeight = rowHashes().length * 41;

    // Spacers plus rendered rows account for every row in the list, which is
    // what keeps the scrollbar honest and stops rows being dropped.
    expect(Math.round(reserved + renderedHeight)).toBe(400 * 41);
  });

  it("renders different rows after scrolling", async () => {
    const many = Array.from({ length: 400 }, (_, i) => tx(i));
    mocks.gqlFetch.mockResolvedValue(page(many, null, false));
    await renderExplorer();

    const before = rowHashes();
    const scroll = screen.getByTestId("transaction-scroll");

    await act(async () => {
      scroll.scrollTop = 4000;
      fireEvent.scroll(scroll);
    });

    const after = rowHashes();
    expect(after).not.toEqual(before);
    expect(after.length).toBeGreaterThan(0);
  });
});
