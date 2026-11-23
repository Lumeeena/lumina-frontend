// @vitest-environment jsdom
/**
 * The contract page's storage browser: filters read from the URL, archived
 * entries shown without a value, and pagination that keeps the active filters.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ContractInterfaceResult } from "@/lib/contractInterface";

const gqlFetch = vi.hoisted(() => vi.fn());
const getContractInterface = vi.hoisted(() => vi.fn());

vi.mock("@/lib/graphql", () => ({
  gqlFetch,
  GRAPHQL_URL: "http://test/graphql",
  PUBLIC_GRAPHQL_URL: "http://test/graphql",
}));

vi.mock("@/lib/contractInterface", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/contractInterface")
  >("@/lib/contractInterface");
  return { ...actual, getContractInterface };
});

// Client widgets in the page header, with their own tests.
vi.mock("@/components/WatchIndicator", () => ({ default: () => null }));
vi.mock("@/components/CopyAddressButton", () => ({ default: () => null }));
vi.mock("@/components/ViewTracker", () => ({ default: () => null }));

import ContractPage from "./contracts/[contractId]/page";

const CONTRACT = "CAYUDQPV3RKPM3EXDFGI3457FV677JLUCJ4OLKWGCUBPRIHYKXK3WFAZ";

const ACTIVE_ENTRY = {
  key: "AAAADwAAAAdjb3VudGVy",
  durability: "PERSISTENT",
  state: "ACTIVE",
  value: "1",
  valueXdr: "AAAAAQ==",
  lastModifiedLedger: 120,
  liveUntilLedger: 500,
};

const ARCHIVED_ENTRY = {
  key: "AAAADwAAAAdvbGQ=",
  durability: "PERSISTENT",
  state: "ARCHIVED",
  value: null,
  valueXdr: null,
  lastModifiedLedger: 90,
  liveUntilLedger: null,
};

function contractInterface(): ContractInterfaceResult {
  return {
    functions: [],
    wasmHash: null,
    deployment: null,
    unreadable: false,
    unavailable: true,
  };
}

function storagePage(
  items: unknown[],
  pageInfo = { hasNextPage: false, cursor: null as string | null },
) {
  return { contractStorageEntries: { items, pageInfo } };
}

async function renderPage(searchParams: Record<string, string | string[]>) {
  return render(
    await ContractPage({
      params: Promise.resolve({ contractId: CONTRACT }),
      searchParams: Promise.resolve(searchParams),
    }),
  );
}

beforeEach(() => {
  gqlFetch.mockReset();
  getContractInterface.mockReset();
  getContractInterface.mockResolvedValue(contractInterface());
});

afterEach(cleanup);

describe("ContractPage storage browser", () => {
  it("sends the URL's key prefix and durability to the storage query", async () => {
    gqlFetch.mockResolvedValue(storagePage([ACTIVE_ENTRY]));
    await renderPage({
      keyPrefix: "AAAADwAAAAdj",
      durability: "persistent",
      storageCursor: "c1",
    });

    expect(gqlFetch).toHaveBeenCalledWith(
      "http://test/graphql",
      expect.anything(),
      expect.objectContaining({
        contractId: CONTRACT,
        keyPrefix: "AAAADwAAAAdj",
        durability: "PERSISTENT",
        cursor: "c1",
      }),
    );
  });

  it("shows an archived entry as archived rather than as an empty value", async () => {
    gqlFetch.mockResolvedValue(storagePage([ACTIVE_ENTRY, ARCHIVED_ENTRY]));
    await renderPage({});

    expect(
      screen.getByText(
        "Archived: the TTL expired. Restore the entry to read its value.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("500")).toBeTruthy();
  });

  it("keeps the active filters on the next-page link", async () => {
    gqlFetch.mockResolvedValue(
      storagePage([ACTIVE_ENTRY], { hasNextPage: true, cursor: "next/1+=" }),
    );
    await renderPage({ keyPrefix: "AAAA", durability: "TEMPORARY" });

    expect(
      screen.getByRole("link", { name: "Next →" }).getAttribute("href"),
    ).toBe(
      `/contracts/${CONTRACT}?keyPrefix=AAAA&durability=TEMPORARY&storageCursor=next%2F1%2B%3D`,
    );
  });

  it("explains an empty result when filters are applied", async () => {
    gqlFetch.mockResolvedValue(storagePage([]));
    await renderPage({ durability: "TEMPORARY" });

    expect(
      screen.getByText("No storage entries match these filters."),
    ).toBeTruthy();
  });

  it("says why an invalid key prefix was not applied", async () => {
    gqlFetch.mockResolvedValue(storagePage([ACTIVE_ENTRY]));
    await renderPage({ keyPrefix: "bad!" });

    expect(gqlFetch).toHaveBeenCalledWith(
      "http://test/graphql",
      expect.anything(),
      expect.objectContaining({ keyPrefix: null }),
    );
    expect(
      screen.getByText(/The key prefix must be base64 XDR/),
    ).toBeTruthy();
  });
});
