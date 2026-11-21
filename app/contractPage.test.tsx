// @vitest-environment jsdom
/**
 * The contract page's deployment section and its "same code" list (#380).
 *
 * The list belongs to the deployment: it is shown inside that section, and
 * only once the deployment loaded, so an unavailable API never reads as
 * "no other contract shares this code".
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
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
const SIBLING = "CBQHNAXSI55GX2GN6D67GK7BHVPSLJUGZQEU7WJ5LKR5PNUCGLIMAO4K";
const DEPLOYER = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";

function contractInterface(
  deployment: ContractInterfaceResult["deployment"],
): ContractInterfaceResult {
  return {
    functions: [],
    wasmHash: "abc",
    deployment,
    unreadable: false,
    unavailable: deployment === null,
  };
}

async function renderPage() {
  return render(
    await ContractPage({
      params: Promise.resolve({ contractId: CONTRACT }),
      searchParams: Promise.resolve({}),
    }),
  );
}

function deploymentSection() {
  return screen
    .getByRole("heading", { name: "Deployment" })
    .closest("section") as HTMLElement;
}

beforeEach(() => {
  gqlFetch.mockReset();
  getContractInterface.mockReset();
  gqlFetch.mockResolvedValue({
    contractStorageEntries: {
      items: [],
      pageInfo: { hasNextPage: false, cursor: null },
    },
  });
});

afterEach(cleanup);

describe("ContractPage deployment section", () => {
  it("lists the contracts that share this wasm inside the deployment section", async () => {
    getContractInterface.mockResolvedValue(
      contractInterface({
        deployer: DEPLOYER,
        deploymentLedger: 500,
        wasmHash: "abc",
        sharedWasmContracts: [
          {
            contractId: SIBLING,
            deployer: DEPLOYER,
            deployedLedger: 900,
            deployedAt: "2026-11-20T00:00:00Z",
          },
        ],
      }),
    );
    await renderPage();

    const section = within(deploymentSection());
    expect(
      section.getByRole("heading", { name: "Contracts with the same code" }),
    ).toBeTruthy();
    expect(
      section
        .getAllByRole("link")
        .some((a) => a.getAttribute("href") === `/contracts/${SIBLING}`),
    ).toBe(true);
    // The deployment's own ledger is read from the API's `deployedLedger`.
    expect(
      section.getByRole("link", { name: "500" }).getAttribute("href"),
    ).toBe("/ledgers/500");
  });

  it("says no other contract shares the code when the deployment has none", async () => {
    getContractInterface.mockResolvedValue(
      contractInterface({
        deployer: DEPLOYER,
        deploymentLedger: 500,
        wasmHash: "abc",
        sharedWasmContracts: [],
      }),
    );
    await renderPage();

    expect(
      within(deploymentSection()).getByText(
        "No other indexed contract was deployed from this wasm.",
      ),
    ).toBeTruthy();
  });

  it("leaves the list out when the deployment could not be loaded", async () => {
    getContractInterface.mockResolvedValue(contractInterface(null));
    await renderPage();

    expect(screen.queryByText("Contracts with the same code")).toBeNull();
    expect(screen.queryByText(/No other indexed contract/)).toBeNull();
    expect(
      within(deploymentSection()).getAllByText("Unavailable"),
    ).toHaveLength(2);
  });
});
