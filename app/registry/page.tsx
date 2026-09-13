'use client';

import { useCallback, useEffect, useState } from "react";
import { getActiveContracts, RegistryEntry } from "@/lib/registry";
import { connectWallet, getConnectedAddress } from "@/lib/wallet";
import { truncateAddress } from "@/lib/formatters";
import RegisterContractForm from "@/components/RegisterContractForm";
import OwnerContracts from "@/components/OwnerContracts";

type Tab = "mine" | "all";

export default function RegistryPage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const [entries, setEntries] = useState<RegistryEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [entriesError, setEntriesError] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>("all");
  // Bumped to make the owner dashboard re-read after a registration.
  const [ownerRefresh, setOwnerRefresh] = useState(0);

  const applyEntries = useCallback((result: RegistryEntry[]) => {
    setEntries(result);
    setEntriesError(null);
    setEntriesLoading(false);
  }, []);

  const applyEntriesError = useCallback((err: unknown) => {
    setEntriesError(err instanceof Error ? err.message : "Couldn't reach the registry contract.");
    setEntriesLoading(false);
  }, []);

  const loadEntries = useCallback(
    () => getActiveContracts().then(applyEntries, applyEntriesError),
    [applyEntries, applyEntriesError]
  );

  useEffect(() => {
    // The effect body only starts requests; all state lands in promise
    // handlers, so nothing cascades a render synchronously.
    let cancelled = false;

    getActiveContracts().then(
      result => !cancelled && applyEntries(result),
      err => !cancelled && applyEntriesError(err)
    );

    getConnectedAddress().then(address => {
      if (cancelled) return;
      setWalletAddress(address);
      if (address) setTab("mine");
    });

    return () => {
      cancelled = true;
    };
  }, [applyEntries, applyEntriesError]);

  async function handleConnect() {
    setConnecting(true);
    setConnectError(null);
    const result = await connectWallet();
    if ("error" in result) {
      setConnectError(result.error);
    } else {
      setWalletAddress(result.address);
      setTab("mine");
    }
    setConnecting(false);
  }

  function handleRegistered() {
    setOwnerRefresh(n => n + 1);
    loadEntries();
  }

  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12">
      <h1 className="font-extrabold text-3xl mb-2 text-[#0e0e12]">Lumina Registry</h1>
      <p className="text-[#6b6975] mb-8 max-w-[70ch]">
        An on-chain Soroban manifest of contracts Lumina indexes. Register your contract to opt into priority indexing — permissionless, on Stellar/Soroban testnet.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8 items-start">
        <div className="border border-[#e5e3ea] rounded-2xl p-6 bg-[#fafafa]">
          <h2 className="font-extrabold text-base mb-[18px] text-[#0e0e12]">Register a Contract</h2>

          {!walletAddress ? (
            <div className="flex flex-col gap-3">
              <p className="text-[13px] text-[#6b6975]">Connect a wallet to register and manage contracts.</p>
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-50 text-white font-bold text-sm py-3 rounded-lg transition-colors"
              >
                {connecting ? "Connecting…" : "Connect Wallet"}
              </button>
              {connectError && (
                <div role="alert" className="text-xs text-[#dc2626] bg-[#fef2f2] rounded-lg px-3 py-2">
                  {connectError}
                </div>
              )}
            </div>
          ) : (
            <RegisterContractForm walletAddress={walletAddress} onRegistered={handleRegistered} />
          )}
        </div>

        <div>
          <div className="flex items-center gap-1 mb-3.5" role="tablist">
            <TabButton active={tab === "mine"} onClick={() => setTab("mine")} disabled={!walletAddress}>
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
                onChanged={loadEntries}
              />
            ) : (
              <p className="text-sm text-[#a6a3b0]">Connect a wallet to see the contracts you registered.</p>
            )
          ) : entriesLoading ? (
            <p className="text-sm text-[#a6a3b0]">Loading registry entries…</p>
          ) : entriesError ? (
            <p className="text-sm text-[#dc2626]">{entriesError}</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-[#a6a3b0]">No contracts registered yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {entries.map(entry => (
                <div key={entry.contractId} className="border border-[#e5e3ea] rounded-[10px] p-3.5 px-4">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-sm text-[#0e0e12]">{entry.name}</span>
                    <span className="mono text-[11px] text-[#a6a3b0]">{truncateAddress(entry.contractId, 5)}</span>
                  </div>
                  <p className="text-xs text-[#6b6975] m-0">{entry.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
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
        active ? "bg-[#f5f3ff] text-[#7c3aed]" : "text-[#6b6975] hover:text-[#0e0e12]"
      }`}
    >
      {children}
    </button>
  );
}
