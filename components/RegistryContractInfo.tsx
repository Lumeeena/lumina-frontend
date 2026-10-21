"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CopyAddressButton from "@/components/CopyAddressButton";
import {
  checkRegistryVersion,
  EXPECTED_REGISTRY_VERSION,
  getRegistryVersion,
  NETWORK_PASSPHRASE,
  REGISTRY_CONTRACT_ID,
} from "@/lib/registry";
import { DEFAULT_NETWORK, networkForPassphrase, withNetwork } from "@/lib/network";

export interface RegistryContractInfoProps {
  contractId?: string;
  passphrase?: string;
  /** Reads the deployed build number; injected so tests need no RPC. */
  readVersion?: () => Promise<number>;
}

/**
 * Which registry this page is talking to: its address, the network it is on,
 * a link to the contract inspector, and a warning when the deployed build is
 * not the one this frontend targets.
 */
export default function RegistryContractInfo({
  contractId = REGISTRY_CONTRACT_ID,
  passphrase = NETWORK_PASSPHRASE,
  readVersion = getRegistryVersion,
}: RegistryContractInfoProps) {
  const [versionWarning, setVersionWarning] = useState<string | null>(null);
  const network = networkForPassphrase(passphrase);

  useEffect(() => {
    let cancelled = false;
    readVersion().then(
      (onChain) => {
        const status = checkRegistryVersion(onChain);
        if (cancelled || status.status === "match") return;
        setVersionWarning(
          `This registry is version ${onChain}, but this frontend expects version ${EXPECTED_REGISTRY_VERSION}. Registering is blocked until they match.`,
        );
      },
      () => {
        if (!cancelled) {
          setVersionWarning(
            `This registry does not report a version, so it may not match this frontend (expects version ${EXPECTED_REGISTRY_VERSION}).`,
          );
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [readVersion]);

  return (
    <section
      aria-labelledby="registry-contract-heading"
      className="border border-[var(--color-border-default)] rounded-[10px] p-4 mb-8 bg-[var(--color-bg-subtle)] text-sm"
    >
      <h2
        id="registry-contract-heading"
        className="font-bold text-[var(--color-text-primary)] mb-2"
      >
        Registry contract
      </h2>
      <p className="text-[var(--color-text-muted)] mb-2">
        Network: {network ? network.label : "Unknown network"}
      </p>
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <code className="mono break-all text-[var(--color-text-primary)]">
          {contractId}
        </code>
        <CopyAddressButton address={contractId} />
      </div>
      <Link
        href={withNetwork(`/contracts/${contractId}`, network?.id ?? DEFAULT_NETWORK)}
        className="text-[var(--color-accent-text)] hover:underline"
      >
        Open in contract inspector
      </Link>
      {versionWarning && (
        <p role="alert" className="mt-3 text-[var(--color-error-text)]">
          {versionWarning}
        </p>
      )}
    </section>
  );
}
