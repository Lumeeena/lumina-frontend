"use client";

import type { Metadata } from "next";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { routeMetadata } from "@/lib/metadata";
import { REGISTRY } from "@/lib/routes";
import {
  CATEGORIES,
  getActiveProfiles,
  isCategory,
  withCategories,
  type Category,
  type RegistryProfile,
} from "@/lib/registry";
import {
  checkNetworkMismatch,
  connectWallet,
  disconnectWallet,
  getConnectedWallet,
  readPersistedSession,
  type WalletSession,
} from "@/lib/wallet";
import { subscribeLocale, t, type MessageKey } from "@/lib/i18n";
import BackendUnavailable from "@/components/BackendUnavailable";
import RegistryContractInfo from "@/components/RegistryContractInfo";
import WalletInfo from "@/components/WalletInfo";
import { Button } from "@/components/ui/Button";

type Tab = "mine" | "all";
type WalletError =
  { key: MessageKey; values?: Record<string, string> } | { detail: string };
const CATEGORY_MESSAGE_KEYS = {
  DeFi: "registry.category.DeFi",
  Nft: "registry.category.Nft",
  Gaming: "registry.category.Gaming",
  Identity: "registry.category.Identity",
  Infrastructure: "registry.category.Infrastructure",
  Payments: "registry.category.Payments",
  Oracle: "registry.category.Oracle",
  Dao: "registry.category.Dao",
  Other: "registry.category.Other",
} satisfies Record<Category, MessageKey>;

function walletErrorMessage(error: WalletError): string {
  return "key" in error ? t(error.key, error.values) : error.detail;
}

const RegisterContractForm = lazy(
  () => import("@/components/RegisterContractForm"),
);
const OwnerContracts = lazy(() => import("@/components/OwnerContracts"));
const RegistryEntryCard = lazy(() => import("@/components/RegistryEntryCard"));

function RegistryListPlaceholder({
  count,
  message,
}: {
  count: number;
  message: string;
}) {
  return (
    <div
      role="status"
      className="flex flex-col gap-2 text-sm text-[var(--color-text-muted)]"
    >
      {Array.from({ length: Math.min(count, 3) }, (_, index) => (
        <div
          key={index}
          className="min-h-36 rounded-[10px] border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] p-4"
        >
          {index === 0 ? message : null}
        </div>
      ))}
    </div>
  );
}

export function generateMetadata(): Metadata {
  return routeMetadata(REGISTRY);
}

// useSearchParams has to sit inside a Suspense boundary for Next to build.
export default function RegistryPage() {
  // Re-render this page whenever the active language changes.
  const [, setLocaleVersion] = useState(0);

  useEffect(() => {
    return subscribeLocale(() => {
      setLocaleVersion((version) => version + 1);
    });
  }, []);

  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-[var(--color-text-muted)] text-sm">
          {t("registry.loading")}
        </div>
      }
    >
      <RegistryContent />
    </Suspense>
  );
}

/**
 * The whole list in one read: get_active_profiles attaches each entry's
 * reputation, which every row needs to show its stake and verification badges.
 * Categories come from a second, tolerant read — and since the contract's
 * category view carries no reputation, the filter is applied here rather than
 * by the contract.
 */
const fetchEntries = async (
  category: Category | null,
): Promise<RegistryProfile[]> => {
  const profiles = await withCategories(await getActiveProfiles());
  return category
    ? profiles.filter((profile) => profile.categories?.includes(category))
    : profiles;
};

function RegistryContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The URL is the source of truth, so a shared link opens the same filter.
  const rawCategory = searchParams?.get("category");
  const category = isCategory(rawCategory) ? rawCategory : null;

  // Seed from localStorage so the UI knows a session likely exists before
  // the async getConnectedWallet() call confirms it.
  const persisted =
    typeof window !== "undefined" ? readPersistedSession() : null;

  const [wallet, setWallet] = useState<WalletSession | null>(null);
  const [walletResolving, setWalletResolving] = useState(persisted !== null);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [connectError, setConnectError] = useState<WalletError | null>(null);
  const [walletLocked, setWalletLocked] = useState(false);

  const walletAddress = wallet?.address ?? null;

  const [entries, setEntries] = useState<RegistryProfile[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [entriesError, setEntriesError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [ownerRefresh, setOwnerRefresh] = useState(0);
  const [showEntries, setShowEntries] = useState(false);
  const entriesPlaceholder = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      tab !== "all" ||
      entriesLoading ||
      entriesError ||
      entries.length === 0 ||
      showEntries
    ) {
      return;
    }

    const target = entriesPlaceholder.current;

    if (!target || typeof IntersectionObserver === "undefined") {
      queueMicrotask(() => setShowEntries(true));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowEntries(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [tab, entriesLoading, entriesError, entries.length, showEntries]);

  const applyEntries = useCallback((result: RegistryProfile[]) => {
    setEntries(result);
    setEntriesError(null);
    setEntriesLoading(false);
  }, []);

  const applyEntriesError = useCallback((err: unknown) => {
    setEntriesError(
      err instanceof Error ? err.message : t("registry.couldNotReach"),
    );
    setEntriesLoading(false);
  }, []);

  const loadEntries = useCallback(
    () => fetchEntries(category).then(applyEntries, applyEntriesError),
    [category, applyEntries, applyEntriesError],
  );

  useEffect(() => {
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
    const reconnect = () => {
      void loadEntries();
    };

    window.addEventListener("lumina:online", reconnect);
    return () => window.removeEventListener("lumina:online", reconnect);
  }, [loadEntries]);

  useEffect(() => {
    // Skip wallet-kit loading for visitors without a persisted session.
    if (!readPersistedSession()) return;

    let cancelled = false;

    getConnectedWallet().then(
      (session) => {
        if (cancelled) return;

        setWallet(session);
        if (session) setTab("mine");
        setWalletResolving(false);
      },
      () => {
        if (cancelled) return;

        setWalletResolving(false);
        setConnectError({ key: "registry.sessionRestoreFailed" });
      },
    );

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
    setWalletLocked(false);

    try {
      const result = await connectWallet();

      if ("error" in result) {
        setConnectError({ detail: result.error });
        setWalletLocked(result.isLocked ?? false);
      } else {
        const mismatch = await checkNetworkMismatch();
        const session = await getConnectedWallet();

        setWallet(session);

        if (mismatch) {
          setConnectError({
            key: "registry.networkMismatch",
            values: {
              walletNetwork: mismatch.walletNetwork,
              appNetwork: mismatch.appNetwork,
            },
          });
        } else {
          setTab("mine");
          setWalletLocked(false);
        }
      }
    } catch {
      setConnectError({ key: "registry.connectFailed" });
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);

    try {
      await disconnectWallet();
      setWallet(null);
      setTab("all");
      setConnectError(null);
    } catch {
      setConnectError({ key: "registry.disconnectFailed" });
    } finally {
      setDisconnecting(false);
    }
  }

  function handleRegistered() {
    setOwnerRefresh((n) => n + 1);
    loadEntries();
  }

  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12">
      <h1 className="font-extrabold text-3xl mb-2 text-[var(--color-text-primary)]">
        {t("registry.heading")}
      </h1>

      <p className="text-[var(--color-text-secondary)] mb-8 max-w-[70ch]">
        {t("registry.description")}
      </p>

      <RegistryContractInfo />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8 items-start">
        <div className="border border-[var(--color-border-default)] rounded-2xl p-6 bg-[var(--color-bg-subtle)]">
          <h2 className="font-extrabold text-base mb-[18px] text-[var(--color-text-primary)]">
            {t("registry.registerContract")}
          </h2>

          {walletResolving ? (
            <p className="text-[13px] text-[var(--color-text-muted)]">
              {t("registry.connecting")}
            </p>
          ) : !walletAddress ? (
            <div className="flex flex-col gap-3">
              <p className="text-[13px] text-[var(--color-text-secondary)]">
                {t("registry.connectPrompt")}
              </p>

              <Button
                variant="primary"
                size="md"
                loading={connecting}
                loadingText={t("registry.connecting")}
                onClick={handleConnect}
                className="w-full"
              >
                {t("common.connect")}
              </Button>

              {connectError && (
                <div
                  role="alert"
                  className="text-xs text-[var(--color-error-text)] bg-[var(--color-error-bg)] rounded-lg px-3 py-2"
                >
                  {walletLocked ? (
                    <div>
                      <p className="font-semibold mb-1">
                        {t("registry.walletLocked")}
                      </p>
                      <p className="text-[var(--color-error-dark)]">
                        {t("registry.unlockHint")}
                      </p>
                    </div>
                  ) : "key" in connectError &&
                    connectError.key === "registry.networkMismatch" ? (
                    <div>
                      <p className="font-semibold mb-1">
                        {t("registry.networkMismatchTitle")}
                      </p>
                      <p className="text-[var(--color-error-dark)]">
                        {walletErrorMessage(connectError)}
                      </p>
                    </div>
                  ) : (
                    <p>
                      {t("registry.walletRetry", {
                        error: walletErrorMessage(connectError),
                      })}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {connectError && (
                <p
                  role="alert"
                  className="text-xs text-[var(--color-error-text)] bg-[var(--color-error-bg)] rounded-lg px-3 py-2"
                >
                  {walletErrorMessage(connectError)}
                </p>
              )}

              <WalletInfo
                address={wallet!.address}
                walletName={wallet!.walletName}
                walletIcon={wallet!.walletIcon}
                onDisconnect={handleDisconnect}
                disconnecting={disconnecting}
              />

              <Suspense
                fallback={
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {t("common.loading")}
                  </p>
                }
              >
                <RegisterContractForm
                  walletAddress={walletAddress}
                  onRegistered={handleRegistered}
                />
              </Suspense>
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
              {t("registry.myContracts")}
            </TabButton>

            <TabButton active={tab === "all"} onClick={() => setTab("all")}>
              {t("registry.recentlyRegistered")}
            </TabButton>
          </div>

          {tab === "all" && (
            <div
              className="flex flex-wrap gap-1.5 mb-3.5"
              role="group"
              aria-label={t("registry.filterByCategory")}
            >
              <CategoryChip
                active={category === null}
                onClick={() => handleCategory(null)}
              >
                {t("registry.all")}
              </CategoryChip>

              {CATEGORIES.map((c) => (
                <CategoryChip
                  key={c}
                  active={category === c}
                  onClick={() => handleCategory(c)}
                >
                  {t(CATEGORY_MESSAGE_KEYS[c])}
                </CategoryChip>
              ))}
            </div>
          )}

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-full px-4 sm:px-0">
              {tab === "mine" ? (
                walletAddress ? (
                  <Suspense
                    fallback={
                      <p className="text-sm text-[var(--color-text-muted)]">
                        {t("owner.loadingContracts")}
                      </p>
                    }
                  >
                    <OwnerContracts
                      key={`${walletAddress}:${ownerRefresh}`}
                      walletAddress={walletAddress}
                      onChanged={loadEntries}
                    />
                  </Suspense>
                ) : (
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {t("registry.connectToSee")}
                  </p>
                )
              ) : entriesLoading ? (
                <p className="text-sm text-[var(--color-text-muted)]">
                  {t("registry.loadingEntries")}
                </p>
              ) : entriesError ? (
                <BackendUnavailable onRetry={loadEntries} />
              ) : entries.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">
                  {category
                    ? t("registry.noActiveContracts", {
                        category: t(CATEGORY_MESSAGE_KEYS[category]),
                      })
                    : t("registry.noContractsYet")}
                </p>
              ) : (
                <div
                  ref={entriesPlaceholder}
                  data-testid="registry-list"
                  className="flex flex-col gap-2"
                  aria-busy={!showEntries}
                  style={{
                    minHeight:
                      entries.length * 144 +
                      Math.max(0, entries.length - 1) * 8,
                  }}
                >
                  {showEntries ? (
                    <Suspense
                      fallback={
                        <RegistryListPlaceholder
                          count={entries.length}
                          message={t("registry.loadingEntries")}
                        />
                      }
                    >
                      {entries.map((entry) => (
                        <RegistryEntryCard
                          key={entry.contractId}
                          profile={entry}
                        />
                      ))}
                    </Suspense>
                  ) : (
                    <RegistryListPlaceholder
                      count={entries.length}
                      message={t("registry.loadingEntries")}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
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
          ? "bg-[var(--color-accent-surface)] text-[var(--color-accent-text)]"
          : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
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
          ? "bg-[var(--color-accent-surface)] border-[var(--color-accent-fill)] text-[var(--color-accent-text)]"
          : "border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
      }`}
    >
      {children}
    </button>
  );
}
