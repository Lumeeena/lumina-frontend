// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import RegistryContractInfo from "./RegistryContractInfo";
import { ToastProvider } from "@/components/ui/Toast";
import { EXPECTED_REGISTRY_VERSION } from "@/lib/registry";

const CONTRACT_ID = "CAYUDQPV3RKPM3EXDFGI3457FV677JLUCJ4OLKWGCUBPRIHYKXK3WFAZ";
const PASSPHRASES = {
  mainnet: "Public Global Stellar Network ; September 2015",
  testnet: "Test SDF Network ; September 2015",
  futurenet: "Test SDF Future Network ; October 2022",
};

afterEach(cleanup);

// ToastProvider renders its own live region with role="alert", so version
// warnings are looked up inside the registry section.
const section = () => screen.getByRole("region", { name: "Registry contract" });

function renderInfo(props: {
  passphrase?: string;
  contractId?: string;
  readVersion?: () => Promise<number>;
}) {
  const readVersion = props.readVersion ?? vi.fn(() => Promise.resolve(EXPECTED_REGISTRY_VERSION));
  render(
    <ToastProvider>
      <RegistryContractInfo
        contractId={props.contractId ?? CONTRACT_ID}
        passphrase={props.passphrase}
        readVersion={readVersion}
      />
    </ToastProvider>,
  );
  return { readVersion };
}

describe("RegistryContractInfo", () => {
  it("names the section and shows the contract address with a copy button", async () => {
    const { readVersion } = renderInfo({ passphrase: PASSPHRASES.testnet });

    const section = screen.getByRole("region", { name: "Registry contract" });
    expect(section).toHaveTextContent(CONTRACT_ID);
    expect(
      screen.getByRole("button", { name: "Copy address to clipboard" }),
    ).toBeInTheDocument();
    await waitFor(() => expect(readVersion).toHaveBeenCalledTimes(1));
  });

  it.each([
    ["Testnet", PASSPHRASES.testnet, `/contracts/${CONTRACT_ID}?network=testnet`],
    ["Futurenet", PASSPHRASES.futurenet, `/contracts/${CONTRACT_ID}?network=futurenet`],
    // Mainnet is the default network, so its link carries no parameter.
    ["Mainnet", PASSPHRASES.mainnet, `/contracts/${CONTRACT_ID}`],
  ])("shows %s and links the inspector on that network", async (label, passphrase, href) => {
    renderInfo({ passphrase });

    expect(screen.getByText(`Network: ${label}`)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open in contract inspector" }),
    ).toHaveAttribute("href", href);
  });

  it("labels an unknown passphrase and falls back to the default network for the link", () => {
    renderInfo({ passphrase: "Standalone Network ; February 2017" });

    expect(screen.getByText("Network: Unknown network")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open in contract inspector" }),
    ).toHaveAttribute("href", `/contracts/${CONTRACT_ID}`);
  });

  it("uses the contract id it is given in the text and the link", () => {
    const other = "CBQHNAXSI55GX2GN6D67GK7BHVPSLJUGZQEU7WJ5LKR5PNUCGLIMAO4K";
    renderInfo({ contractId: other, passphrase: PASSPHRASES.testnet });

    expect(screen.getByRole("region", { name: "Registry contract" })).toHaveTextContent(other);
    expect(
      screen.getByRole("link", { name: "Open in contract inspector" }),
    ).toHaveAttribute("href", `/contracts/${other}?network=testnet`);
  });

  it("shows no warning when the deployed version matches", async () => {
    const { readVersion } = renderInfo({ passphrase: PASSPHRASES.testnet });

    await waitFor(() => expect(readVersion).toHaveBeenCalled());
    await Promise.resolve();
    expect(within(section()).queryByRole("alert")).not.toBeInTheDocument();
  });

  it.each([
    ["newer", EXPECTED_REGISTRY_VERSION + 1],
    ["older", EXPECTED_REGISTRY_VERSION - 1],
  ])("warns when the deployed version is %s than expected", async (_kind, onChain) => {
    renderInfo({
      passphrase: PASSPHRASES.testnet,
      readVersion: () => Promise.resolve(onChain),
    });

    expect(await within(section()).findByRole("alert")).toHaveTextContent(
      `This registry is version ${onChain}, but this frontend expects version ${EXPECTED_REGISTRY_VERSION}. Registering is blocked until they match.`,
    );
  });

  it("warns when the registry does not report a version", async () => {
    renderInfo({
      passphrase: PASSPHRASES.testnet,
      readVersion: () => Promise.reject(new Error("no get_version")),
    });

    expect(await within(section()).findByRole("alert")).toHaveTextContent(
      `This registry does not report a version, so it may not match this frontend (expects version ${EXPECTED_REGISTRY_VERSION}).`,
    );
  });

  it("ignores a version read that settles after unmount", async () => {
    let resolveVersion: (v: number) => void = () => {};
    let rejectVersion: (e: Error) => void = () => {};
    const mismatch = new Promise<number>((resolve) => {
      resolveVersion = resolve;
    });
    const failure = new Promise<number>((_resolve, reject) => {
      rejectVersion = reject;
    });

    renderInfo({ passphrase: PASSPHRASES.testnet, readVersion: () => mismatch });
    cleanup();
    renderInfo({ passphrase: PASSPHRASES.testnet, readVersion: () => failure });
    cleanup();

    resolveVersion(EXPECTED_REGISTRY_VERSION + 1);
    rejectVersion(new Error("late"));
    await mismatch;
    await failure.catch(() => undefined);

    expect(console.error).not.toHaveBeenCalled();
  });
});
