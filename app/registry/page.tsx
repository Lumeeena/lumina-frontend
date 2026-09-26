"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  getActiveProfiles,
  getReputation,
  getActiveContractsByCategory,
  isCategory,
  withCategories,
  type Category,
  type RegistryProfile,
} from "@/lib/registry";
import { connectWallet, getConnectedAddress } from "@/lib/wallet";
import RegisterContractForm from "@/components/RegisterContractForm";
import OwnerContracts from "@/components/OwnerContracts";
import RegistryEntryCard from "@/components/RegistryEntryCard";

type Tab = "mine" | "all";

// useSearchParams has to sit inside a Suspense boundary for Next to build.
export default function RegistryPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-[#a6a3b0] text-sm">
          Loading registry…
        </div>
      }
    >
      <RegistryContent />
    </Suspense>
  );
}

/** The contract filters by category, so the server does the narrowing. */
const fetchEntries = (category: Category | null) =>
  (category
    ? getActiveContractsByCategory(category).then((entries) =>
        Promise.all(
          entries.map(async (entry) => ({
            ...entry,
            reputation: await getReputation(entry.contractId),
          })),
        ),
      )
    : getActiveProfiles()
  ).then(async (profiles) => {
    const entries = await withCategories(profiles);
    return profiles.map((profile, index) => ({
      ...profile,
      categories: entries[index].categories,
    }));
  });

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
    setEntriesError(
      err instanceof Error
        ? err.message
        : "Couldn't reach the registry contract.",
    );
    setEntriesLoading(false);
  }, []);

  const loadEntries = useCallback(
    () => fetchEntries(category).then(applyEntries, applyEntriesError),
    [category, applyEntries, applyEntriesError],
  );

  useEffect(() => {
    // The effect body only starts requests; all state lands in promise
    // handlers, so nothing cascades a render synchronously.
    let cancelled = false;

    fetchEntries(category).then(
      (result) => !cancelled && applyEntries(result),
      (err) => !cancelled && applyEntriesError(err),
    );

    return () => {
      cancelled = true;
    };
  }, [category, applyEntries, applyEntriesError]);

  useEffect(() => {
    let cancelled = false;

    getConnectedAddress().then((address) => {
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
    router.replace(next ? `${pathname}?category=${next}` : pathname, {
      scroll: false,
    });
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
    setOwnerRefresh((n) => n + 1);
    loadEntries();
  }

  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12">
      <h1 className="font-extrabold text-3xl mb-2 text-[#0e0e12]">
        Lumina Registry
      </h1>
      <p className="text-[#6b6975] mb-8 max-w-[70ch]">
        An on-chain Soroban manifest of contracts Lumina indexes. Register your
        contract to opt into priority indexing — permissionless, on
        Stellar/Soroban testnet.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8 items-start">
        <div className="border border-[#e5e3ea] rounded-2xl p-6 bg-[#fafafa]">
          <h2 className="font-extrabold text-base mb-[18px] text-[#0e0e12]">
            Register a Contract
          </h2>

          {!walletAddress ? (
            <div className="flex flex-col gap-3">
              <p className="text-[13px] text-[#6b6975]">
                Connect a wallet to register and manage contracts.
              </p>
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-50 text-white font-bold text-sm py-3 rounded-lg transition-colors"
              >
                {connecting ? "Connecting…" : "Connect Wallet"}
              </button>
              {connectError && (
                <div
                  role="alert"
                  className="text-xs text-[#dc2626] bg-[#fef2f2] rounded-lg px-3 py-2"
                >
                  {connectError}
                </div>
              )}
            </div>
          ) : (
            <RegisterContractForm
              walletAddress={walletAddress}
              onRegistered={handleRegistered}
            />
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

          {tab === "all" && (
            <div
              className="flex flex-wrap gap-1.5 mb-3.5"
              role="group"
              aria-label="Filter by category"
            >
              <CategoryChip
                active={category === null}
                onClick={() => handleCategory(null)}
              >
                All
              </CategoryChip>
              {CATEGORIES.map((c) => (
                <CategoryChip
                  key={c}
                  active={category === c}
                  onClick={() => handleCategory(c)}
                >
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
              <p className="text-sm text-[#a6a3b0]">
                Connect a wallet to see the contracts you registered.
              </p>
            )
          ) : entriesLoading ? (
            <p className="text-sm text-[#a6a3b0]">Loading registry entries…</p>
          ) : entriesError ? (
            <p className="text-sm text-[#dc2626]">{entriesError}</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-[#a6a3b0]">
              {category
                ? `No active ${CATEGORY_LABELS[category]} contracts.`
                : "No contracts registered yet."}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {entries.map((entry) => (
                <div
                  key={entry.contractId}
                  className="border border-[#e5e3ea] rounded-[10px] p-3.5 px-4"
                >
                  <RegistryEntryCard profile={entry} />
                  {entry.categories && entry.categories.length > 0 && (
                    <ul
                      className="flex flex-wrap gap-1.5 mt-2 list-none p-0 m-0"
                      aria-label="Categories"
                    >
                      {entry.categories.map((c) => (
                        <li
                          key={c}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f5f3ff] text-[#7c3aed]"
                        >
                          {CATEGORY_LABELS[c]}
                        </li>
                      ))}
                    </ul>
                  )}
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
        active
          ? "bg-[#f5f3ff] text-[#7c3aed]"
          : "text-[#6b6975] hover:text-[#0e0e12]"
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
