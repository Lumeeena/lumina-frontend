"use client";

import { useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import {
  checkNetworkMismatch,
  connectWallet,
  disconnectWallet,
  getConnectedWallet,
  readPersistedSession,
  type WalletSession,
} from "@/lib/wallet";
import WalletInfo from "./WalletInfo";
import { Button } from "./ui/Button";
import { refreshRegistry } from "@/app/registry/actions";

const RegisterContractForm = dynamic(() => import("./RegisterContractForm"));
const OwnerContracts = dynamic(() => import("./OwnerContracts"));
type Tab = "mine" | "all";

export default function RegistryWorkspace({ listing }: { listing: ReactNode }) {
  const [wallet, setWallet] = useState<WalletSession | null>(null);
  const [walletResolving, setWalletResolving] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [walletLocked, setWalletLocked] = useState(false);

  // Convenience: address is still used in several places below.
  const walletAddress = wallet?.address ?? null;

  const [tab, setTab] = useState<Tab>("all");
  // Bumped to make the owner dashboard re-read after a registration.
  const [ownerRefresh, setOwnerRefresh] = useState(0);

  useEffect(() => {
    // No persisted session means there is nothing to confirm — and confirming
    // is what would pull the wallet kit in. Skipping it keeps the kit out of
    // the browser entirely for a visitor who never connects.
    let cancelled = false;

    const session = readPersistedSession()
      ? getConnectedWallet()
      : Promise.resolve(null);
    session.then((session) => {
      if (cancelled) return;
      setWallet(session);
      if (session) setTab("mine");
      setWalletResolving(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleConnect() {
    setConnecting(true);
    setConnectError(null);
    setWalletLocked(false);
    const result = await connectWallet();
    if ("error" in result) {
      setConnectError(result.error);
      setWalletLocked(result.isLocked ?? false);
    } else {
      // Check for network mismatch after successful connection
      const mismatch = await checkNetworkMismatch();
      if (mismatch) {
        setConnectError(mismatch.error);
        // Still set the wallet session so user can see their wallet info
        const session = await getConnectedWallet();
        setWallet(session);
      } else {
        // Re-fetch full session so we get name + icon too (#88).
        const session = await getConnectedWallet();
        setWallet(session);
        setTab("mine");
        setWalletLocked(false);
      }
    }
    setConnecting(false);
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await disconnectWallet();
    } finally {
      setWallet(null);
      setTab("all");
      setDisconnecting(false);
    }
  }

  function handleRegistered() {
    setOwnerRefresh((n) => n + 1);
    void refreshRegistry();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8 items-start">
      <div className="border border-[var(--color-border-default)] rounded-2xl p-6 bg-[var(--color-bg-subtle)]">
        <h2 className="font-extrabold text-base mb-[18px] text-[var(--color-text-primary)]">
          Register a Contract
        </h2>

        {walletResolving ? (
          <p className="text-[13px] text-[var(--color-text-muted)]">
            Connecting…
          </p>
        ) : !walletAddress ? (
          <div className="flex flex-col gap-3">
            <p className="text-[13px] text-[var(--color-text-secondary)]">
              Connect a wallet to register and manage contracts.
            </p>
            <Button
              variant="primary"
              size="md"
              loading={connecting}
              loadingText="Connecting…"
              onClick={handleConnect}
              className="w-full"
            >
              Connect Wallet
            </Button>
            {connectError && (
              <div
                role="alert"
                className="text-xs text-[var(--color-error-text)] bg-[var(--color-error-bg)] rounded-lg px-3 py-2"
              >
                {walletLocked ? (
                  <div>
                    <p className="font-semibold mb-1">Your wallet is locked</p>
                    <p className="text-[var(--color-error-dark)]">
                      Unlock your wallet extension and try again.
                    </p>
                  </div>
                ) : connectError.includes("Network mismatch") ? (
                  <div>
                    <p className="font-semibold mb-1">Network Mismatch</p>
                    <p className="text-[var(--color-error-dark)]">
                      {connectError}
                    </p>
                  </div>
                ) : (
                  connectError
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <WalletInfo
              address={wallet!.address}
              walletName={wallet!.walletName}
              walletIcon={wallet!.walletIcon}
              onDisconnect={handleDisconnect}
              disconnecting={disconnecting}
            />
            <RegisterContractForm
              walletAddress={walletAddress}
              onRegistered={handleRegistered}
            />
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-1 mb-3.5" role="tablist">
          <TabButton
            active={tab === "mine"}
            onClick={() => setTab("mine")}
            disabled={!walletAddress}
          >
            My Contracts
          </TabButton>
          <TabButton active={tab === "all"} onClick={() => setTab("all")}>
            Recently Registered
          </TabButton>
        </div>

        {tab === "mine" ? (
          walletAddress ? (
            <OwnerContracts
              key={`${walletAddress}:${ownerRefresh}`}
              walletAddress={walletAddress}
              onChanged={() => void refreshRegistry()}
            />
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">
              Connect a wallet to see the contracts you registered.
            </p>
          )
        ) : (
          listing
        )}
      </div>
    </div>
  );
}
function TabButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      disabled={disabled}
      onClick={onClick}
      className={`text-sm font-extrabold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 ${
        active
          ? "bg-[var(--color-accent-surface)] text-[var(--color-accent-text)]"
          : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
      }`}
    >
      {children}
    </button>
  );
}
