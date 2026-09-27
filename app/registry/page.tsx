'use client';

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  getActiveProfiles,
  isCategory,
  withCategories,
  type Category,
  type RegistryEntry,
  type RegistryProfile,
} from "@/lib/registry";
import { connectWallet, getConnectedAddress } from "@/lib/wallet";
import { truncateAddress } from "@/lib/formatters";
import RegisterContractForm from "@/components/RegisterContractForm";
import OwnerContracts from "@/components/OwnerContracts";
import RegistryEntryCard from "@/components/RegistryEntryCard";

type Tab = "mine" | "all";

// useSearchParams has to sit inside a Suspense boundary for Next to build.
export default function RegistryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[#a6a3b0] text-sm">Loading registry…</div>}>
      <RegistryContent />
    </Suspense>
  );
}

/**
 * The whole list in one read: `get_active_profiles` attaches each entry's
 * reputation, which every row needs to show its stake and verification badges.
 * Categories come from a second, tolerant read — and since the contract's
 * category view carries no reputation, the filter is applied here rather than
 * by the contract.
 */
const fetchEntries = async (category: Category | null): Promise<RegistryProfile[]> => {
  const profiles = await withCategories(await getActiveProfiles());
  return category ? profiles.filter(profile => profile.categories?.includes(category)) : profiles;
};

function RegistryContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // The URL is the source of truth, so a shared link opens the same filter.
  const rawCategory = searchParams?.get("category");
  const category = isCategory(rawCategory) ? rawCategory : null;

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const [entries, setEntries] = useState<RegistryProfile[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [entriesError, setEntriesError] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>("all");
  // Bumped to make the owner dashboard re-read after a registration.
  const [ownerRefresh, setOwnerRefresh] = useState(0);

  const applyEntries = useCallback((result: RegistryProfile[]) => {
    setEntries(result);
    setEntriesError(null);
    setEntriesLoading(false);
  }, []);

  const applyEntriesError = useCallback((err: unknown) => {
    setEntriesError(err instanceof Error ? err.message : "Couldn't reach the registry contract.");
    setEntriesLoading(false);
  }, []);

  const loadEntries = useCallback(
    () => fetchEntries(category).then(applyEntries, applyEntriesError),
    [category, applyEntries, applyEntriesError]
  );

  useEffect(() => {
    // The effect body only starts requests; all state lands in promise
    // handlers, so nothing cascades a render synchronously.
    let cancelled = false;

    fetchEntries(category).then(
      result => !cancelled && applyEntries(result),
      err => !cancelled && applyEntriesError(err)
    );

    return () => {
      cancelled = true;
    };
  }, [category, applyEntries, applyEntriesError]);

  useEffect(() => {
    let cancelled = false;

    getConnectedAddress().then(address => {
      if (cancelled) return;
      setWalletAddress(address);
      if (address) setTab("mine");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  function handleCategory(next: Category | null) {
    if (next === category) return;
    setEntriesLoading(true);
    router.replace(next ? `${pathname}?category=${next}` : pathname, { scroll: false });
  }

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

          {tab === "all" && (
            <div className="flex flex-wrap gap-1.5 mb-3.5" role="group" aria-label="Filter by category">
              <CategoryChip active={category === null} onClick={() => handleCategory(null)}>
                All
              </CategoryChip>
              {CATEGORIES.map(c => (
                <CategoryChip key={c} active={category === c} onClick={() => handleCategory(c)}>
                  {CATEGORY_LABELS[c]}
                </CategoryChip>
              ))}
            </div>
          )}

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
            <p className="text-sm text-[#a6a3b0]">
              {category ? `No active ${CATEGORY_LABELS[category]} contracts.` : "No contracts registered yet."}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {entries.map(entry => (
                <RegistryEntryCard key={entry.contractId} profile={entry} />
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

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-pressed={active}
      onClick={onClick}
      className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-colors ${
        active
          ? "bg-[#f5f3ff] border-[#8b5cf6] text-[#7c3aed]"
          : "border-[#e5e3ea] text-[#6b6975] hover:text-[#0e0e12]"
      }`}
    >
      {children}
    </button>
  );
}
