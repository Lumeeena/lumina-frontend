"use client";

import {
  AccountDetailDocument as ACCOUNT_QUERY,
  OwnerContractEventsDocument as EVENTS_QUERY,
} from "@/lib/generated/graphql";

/**
 * "My Contracts" — everything the connected wallet has registered, with a real
 * deactivate flow, stake and withdraw controls, and the per-contract history
 * derived from registry events.
 *
 * Every data dependency arrives as an optional prop defaulting to the real
 * implementation. That is what makes this testable without a wallet extension
 * or a live network, which the issue asked for and which the registration form
 * has never had.
 */
import { useCallback, useEffect, useState } from "react";
import { nativeToScVal, type xdr } from "@stellar/stellar-sdk/base";
import {
  getContractsByOwner,
  getSlashes,
  getStakeInfo,
  NETWORK_PASSPHRASE,
  REGISTRY_CONTRACT_ID,
  type RegistryEntry,
  type RegistryReputation,
  type SlashRecord,
  SOROBAN_RPC_URL,
  type StakeInfo,
} from "@/lib/registry";
import {
  ContractCallError,
  WalletRejectedError,
  createStellarDriver,
  submitContractCall,
  type TxPhase,
} from "@/lib/sorobanTx";
import { gqlFetch, PUBLIC_GRAPHQL_URL } from "@/lib/graphql";
import { useAbortScope, type AbortHandle } from "@/lib/useAbortScope";
import {
  historyFor,
  parseRegistryEvents,
  REGISTRY_EVENT_LABELS,
  type RegistryHistoryEntry,
} from "@/lib/registryHistory";
import {
  ACTIVITY_LABELS,
  probeContractActivity,
  type ActivityState,
} from '@/lib/contractActivity';
import type { ContractEvent } from '@/lib/types';
import { formatStroops, truncateAddress } from '@/lib/formatters';
import { trackTransaction } from '@/lib/pendingTransactions';
import {
  checkReserve,
  WORST_CASE_FEE_STROOPS,
  type ReserveCheck,
} from '@/lib/reserve';
import TimeAgo from './TimeAgo';
import { LifetimeSlashedBadge, StakeBadge, VerifiedBadge } from './RegistryBadges';
import BackendUnavailable from './BackendUnavailable';
import ContractLink from './ContractLink';
import { t } from '@/lib/i18n';
import { transactionRecovery } from '@/lib/errorRecovery';
import { EmptyState } from '@/components/ui/EmptyState';
import { InlineLoading } from '@/components/ui/InlineLoading';

function rememberTransaction(hash: string) {
  sessionStorage.setItem(`tx-${Date.now()}`, hash);
}

async function fetchEvents(
  contractId: string,
  limit: number,
  signal?: AbortSignal,
): Promise<ContractEvent[]> {
  const data = await gqlFetch(
    PUBLIC_GRAPHQL_URL,
    EVENTS_QUERY,
    { contractId, limit },
    { signal },
  );
  return data.events.items;
}

export interface OwnerContractsProps {
  walletAddress: string;
  loadContracts?: (owner: string) => Promise<RegistryEntry[]>;
  loadHistory?: (signal?: AbortSignal) => Promise<RegistryHistoryEntry[]>;
  loadActivity?: (
    contractIds: string[],
    signal?: AbortSignal,
  ) => Promise<Map<string, ActivityState>>;
  loadStake?: (contractId: string) => Promise<StakeInfo>;
  deactivate?: (contractId: string, owner: string, onFeeEstimated?: (fee: string) => void) => Promise<{ hash: string } | void>;
  stake?: (contractId: string, owner: string, amount: bigint, onFeeEstimated?: (fee: string) => void) => Promise<{ hash: string } | void>;
  withdraw?: (contractId: string, owner: string, onFeeEstimated?: (fee: string) => void) => Promise<{ hash: string } | void>;
  /** The wallet's native balance and how many ledger entries it owns, for the reserve check. */
  loadBalance?: (address: string) => Promise<{ balance: bigint; subentryCount: number }>;
  /** Notifies the parent so the global list can refresh after a change. */
  onChanged?: () => void;
}

const defaultLoadContracts = (owner: string) => getContractsByOwner(owner);

const defaultLoadHistory = async (signal?: AbortSignal) =>
  parseRegistryEvents(await fetchEvents(REGISTRY_CONTRACT_ID, 100, signal));

const defaultLoadActivity = (contractIds: string[], signal?: AbortSignal) =>
  probeContractActivity(contractIds, (id) => fetchEvents(id, 1, signal));

const defaultLoadStake = (contractId: string) => getStakeInfo(contractId);

const defaultLoadBalance = async (address: string) => {
  const data = await gqlFetch(PUBLIC_GRAPHQL_URL, ACCOUNT_QUERY, { address });
  const native = data.account?.balances.find((b) => b.assetType === "native");
  return {
    // Horizon reports native balances as decimal XLM; the contract works in stroops.
    balance: BigInt(Math.round(parseFloat(native?.balance ?? "0") * 10_000_000)),
    subentryCount: data.account?.subentryCount ?? 0,
  };
};

async function callRegistry(
  owner: string,
  method: string,
  args: xdr.ScVal[],
  onFeeEstimated?: (fee: string) => void,
  onPhase?: (phase: TxPhase) => void,
): Promise<{ hash: string }> {
  // Imported lazily rather than at module scope: the wallet kit pulls in
  // browser-only CommonJS (Freighter et al) that cannot be loaded outside a
  // browser, which would otherwise make this component untestable — the exact
  // problem the issue asks to solve. It also keeps the kit out of the page's
  // static bundle until someone actually signs something.
  const { signWithWallet } = await import("@/lib/wallet");

  const result = await submitContractCall({
    driver: createStellarDriver({
      rpcUrl: SOROBAN_RPC_URL,
      networkPassphrase: NETWORK_PASSPHRASE,
      walletAddress: owner,
    }),
    call: { contractId: REGISTRY_CONTRACT_ID, method, args },
    sign: async (xdr, opts) => {
      const signResult = await signWithWallet(xdr, opts);
      if ('error' in signResult) {
        throw new Error(signResult.error);
      }
      return { signedTxXdr: signResult.signedTxXdr };
    },
    walletAddress: owner,
    networkPassphrase: NETWORK_PASSPHRASE,
    onFeeEstimated,
    onPhase,
  });
  return { hash: result.hash };
}

// Each write is tracked so its progress survives navigating away from this
// page. See `lib/pendingTransactions.ts`.
const defaultDeactivate = (contractId: string, owner: string, onFeeEstimated?: (fee: string) => void) =>
  trackTransaction(t("pending.deactivate", { contract: truncateAddress(contractId, 5) }), (report) =>
    callRegistry(owner, "deactivate", [
      nativeToScVal(owner, { type: "address" }),
      nativeToScVal(contractId, { type: "address" }),
    ], onFeeEstimated, report),
  );

const defaultStake = (contractId: string, owner: string, amount: bigint, onFeeEstimated?: (fee: string) => void) =>
  trackTransaction(t("pending.stake", { contract: truncateAddress(contractId, 5) }), (report) =>
    callRegistry(owner, "stake", [
      nativeToScVal(owner, { type: "address" }),
      nativeToScVal(contractId, { type: "address" }),
      nativeToScVal(amount, { type: "i128" }),
    ], onFeeEstimated, report),
  );

const defaultWithdraw = (contractId: string, owner: string, onFeeEstimated?: (fee: string) => void) =>
  trackTransaction(t("pending.withdraw", { contract: truncateAddress(contractId, 5) }), (report) =>
    callRegistry(owner, "withdraw_stake", [
      nativeToScVal(owner, { type: "address" }),
      nativeToScVal(contractId, { type: "address" }),
    ], onFeeEstimated, report),
  );

/**
 * The unmet good-standing conditions for `withdraw_stake`, worked out up front
 * so the owner is told why it is blocked instead of meeting the contract's
 * error afterwards. Mirrors the contract's checks: deactivated, not within the
 * post-slash lock, and something to withdraw.
 */
export function withdrawBlockers(
  entry: RegistryEntry,
  info: StakeInfo | undefined,
): string[] {
  const blockers: string[] = [];
  if (entry.active) {
    blockers.push(t("owner.withdrawBlockerActive"));
  }
  if (info && info.withdrawLockedUntil > info.currentLedger) {
    blockers.push(
      t("owner.withdrawBlockerLocked", {
        until: info.withdrawLockedUntil,
        current: info.currentLedger,
        remaining: info.withdrawLockedUntil - info.currentLedger,
      }),
    );
  }
  if (info && info.stake <= BigInt(0)) {
    blockers.push(t("owner.withdrawBlockerNoStake"));
  }
  return blockers;
}

type LoadState = "loading" | "ready" | "error";

export default function OwnerContracts({
  walletAddress,
  loadContracts = defaultLoadContracts,
  loadHistory = defaultLoadHistory,
  loadActivity = defaultLoadActivity,
  loadStake = defaultLoadStake,
  deactivate = defaultDeactivate,
  stake = defaultStake,
  withdraw = defaultWithdraw,
  loadBalance = defaultLoadBalance,
  onChanged,
}: OwnerContractsProps) {
  const [entries, setEntries] = useState<RegistryEntry[]>([]);
  const [state, setState] = useState<LoadState>('loading');

  const [history, setHistory] = useState<RegistryHistoryEntry[]>([]);
  const [activity, setActivity] = useState<Map<string, ActivityState>>(
    new Map(),
  );
  const [reputations] = useState<Map<string, RegistryReputation>>(new Map());
  const [slashes, setSlashes] = useState<Record<string, SlashRecord[]>>({});
  const [slashesLoading, setSlashesLoading] = useState<Record<string, boolean>>(
    {},
  );
  const [slashErrors, setSlashErrors] = useState<Record<string, string>>({});
  const [reserveWarning, setReserveWarning] = useState<Record<string, ReserveCheck>>({});

  const [expanded, setExpanded] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingPhase, setPendingPhase] = useState<TxPhase>("idle");
  const [pendingAction, setPendingAction] = useState<
    "deactivate" | "stake" | "withdraw"
  >("deactivate");
  const [stakeInfo, setStakeInfo] = useState<Record<string, StakeInfo>>({});
  const [stakeInput, setStakeInput] = useState<Record<string, string>>({});
  const [rowError, setRowError] = useState<Record<string, string>>({});
  const [pendingTxHash, setPendingTxHash] = useState<string | null>(null);
  const [estimatedFee, setEstimatedFee] = useState<string | null>(null);
  const [rejected, setRejected] = useState<Record<string, { owner: string; retry: () => Promise<void> }>>({});

  // Every read below is started through this scope, so a wallet switch or an
  // unmount cancels them instead of letting a slow answer land afterwards.
  const scope = useAbortScope(walletAddress);

  const applyLoaded = useCallback(
    (owned: RegistryEntry[], req: AbortHandle) => {
      if (!req.isCurrent()) return;
      setEntries(owned);
      setState("ready");

      // History, activity and reputation are decoration: a registry read that
      // succeeded should render even if the indexer is unreachable, so these
      // are deliberately not chained onto the read above. They share the
      // registry read's signal — what cancels it cancels them too.
      loadHistory(req.signal)
        .then((h) => req.isCurrent() && setHistory(h))
        .catch(() => req.isCurrent() && setHistory([]));
      if (owned.length > 0) {
        loadActivity(owned.map((e) => e.contractId), req.signal)
          .then((a) => req.isCurrent() && setActivity(a))
          .catch(() => req.isCurrent() && setActivity(new Map()));
        // Stake is decoration too: without it the controls still work, they
        // just cannot pre-explain a blocked withdrawal.
        owned.forEach((e) =>
          loadStake(e.contractId)
            .then(
              (info) =>
                req.isCurrent() &&
                setStakeInfo((prev) => ({ ...prev, [e.contractId]: info })),
            )
            .catch(() => {}),
        );
      }
    },
    [loadHistory, loadActivity, loadStake],
  );

  const applyError = useCallback((_err: unknown, req: AbortHandle) => {
    if (!req.isCurrent()) return;
    setState('error');
  }, []);

  useEffect(() => {
    // The effect body only starts the reads; every setState happens in a
    // settled-promise handler, and only while its request is still the current
    // one — a wallet switch or an unmount has already cancelled the rest.
    const req = scope.next();

    loadContracts(walletAddress).then(
      (owned) => applyLoaded(owned, req),
      (err) => applyError(err, req),
    );
  }, [scope, walletAddress, loadContracts, applyLoaded, applyError]);

  const pendingTxInFlight = pendingPhase === 'building' || pendingPhase === 'awaiting-signature' || pendingPhase === 'submitting' || pendingPhase === 'confirming';

  useEffect(() => {
    if (!pendingTxInFlight) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pendingTxInFlight]);

  /** Retry, driven by a click rather than an effect. */
  const retry = useCallback(() => {
    const req = scope.next();
    setState("loading");
    loadContracts(walletAddress).then(
      (owned) => applyLoaded(owned, req),
      (err) => applyError(err, req),
    );
  }, [scope, walletAddress, loadContracts, applyLoaded, applyError]);

  /**
   * Re-read the history after a change, on the same lifetime as the rest: if
   * the component goes away mid-read the answer is cancelled, not applied.
   */
  const refreshHistory = useCallback(() => {
    const req = scope.next();
    loadHistory(req.signal)
      .then((h) => req.isCurrent() && setHistory(h))
      .catch(() => {});
  }, [scope, loadHistory]);

  async function toggleHistory(entry: RegistryEntry, retry = false) {
    const id = entry.contractId;
    const opening = retry || expanded !== id;
    setExpanded(opening ? id : null);
    if (!opening || slashes[id] || slashesLoading[id]) return;
    setSlashesLoading((prev) => ({ ...prev, [id]: true }));
    setSlashErrors((prev) => ({ ...prev, [id]: "" }));
    try {
      const records = await getSlashes(id);
      setSlashes((prev) => ({ ...prev, [id]: records }));
    } catch {
      setSlashErrors((prev) => ({
        ...prev,
        [id]: t("owner.couldNotLoadSlashHistory"),
      }));
    } finally {
      setSlashesLoading((prev) => ({ ...prev, [id]: false }));
    }
  }

  function refreshStake(contractId: string) {
    loadStake(contractId)
      .then((info) => setStakeInfo((prev) => ({ ...prev, [contractId]: info })))
      .catch(() => {});
  }

  /** Shared by stake and withdraw: run a signed call, surface its error on the row. */
  async function runRowAction(
    entry: RegistryEntry,
    action: "stake" | "withdraw",
    work: () => Promise<{ hash: string } | void>,
    fallback: string,
  ) {
    setPendingId(entry.contractId);
    setPendingAction(action);
    setPendingPhase("building");
    setEstimatedFee(null);
    setRowError((prev) => {
      const next = { ...prev };
      delete next[entry.contractId];
      return next;
    });

    try {
      const result = await work();
      if (result?.hash) {
        setPendingTxHash(result.hash);
        rememberTransaction(result.hash);
      }
      refreshStake(entry.contractId);
      refreshHistory();
      setRejected(prev => { const next = { ...prev }; delete next[entry.contractId]; return next; });
      if (action === 'stake') setStakeInput(prev => ({ ...prev, [entry.contractId]: '' }));
    } catch (err) {
      if (err instanceof WalletRejectedError) {
        setRejected(prev => ({ ...prev, [entry.contractId]: {
          owner: walletAddress,
          retry: () => runRowAction(entry, action, err.retry, fallback),
        } }));
        return;
      }
      setRejected(prev => { const next = { ...prev }; delete next[entry.contractId]; return next; });
      const message =
        err instanceof Error && err.message ? err.message : fallback;
      setRowError((prev) => ({ ...prev, [entry.contractId]: message }));
      if (pendingTxHash) {
        rememberTransaction(pendingTxHash);
      }
    } finally {
      setPendingId(null);
      setPendingPhase("idle");
      setPendingTxHash(null);
    }
  }

  async function handleStake(entry: RegistryEntry, acknowledged = false) {
    const raw = (stakeInput[entry.contractId] ?? "").trim();
    if (!/^\d+$/.test(raw) || BigInt(raw) <= BigInt(0)) {
      setRowError((prev) => ({
        ...prev,
        [entry.contractId]: t("owner.invalidStakeAmount"),
      }));
      return;
    }
    if (!acknowledged) {
      // A failed balance read does not block the stake: the network still has
      // the final word, so this only holds the stake back when it can see a breach.
      const reserve = await loadBalance(walletAddress)
        .then(({ balance, subentryCount }) =>
          checkReserve(balance, subentryCount, BigInt(raw) + WORST_CASE_FEE_STROOPS),
        )
        .catch(() => null);
      if (reserve?.breaches) {
        setReserveWarning((prev) => ({ ...prev, [entry.contractId]: reserve }));
        return;
      }
    }
    setReserveWarning((prev) => {
      const next = { ...prev };
      delete next[entry.contractId];
      return next;
    });
    await runRowAction(
      entry,
      "stake",
      () => stake(entry.contractId, walletAddress, BigInt(raw), setEstimatedFee),
      t("owner.stakingFailed"),
    );
  }

  const handleWithdraw = (entry: RegistryEntry) =>
    runRowAction(
      entry,
      "withdraw",
      () => withdraw(entry.contractId, walletAddress, setEstimatedFee),
      t("owner.withdrawalFailed"),
    );

  async function handleDeactivate(entry: RegistryEntry, retrySignature?: () => Promise<{ hash: string }>) {
    setPendingId(entry.contractId);
    setPendingAction("deactivate");
    setPendingPhase("building");
    setEstimatedFee(null);
    setRowError((prev) => {
      const next = { ...prev };
      delete next[entry.contractId];
      return next;
    });

    try {
      const result = await (retrySignature ? retrySignature() : deactivate(entry.contractId, walletAddress, setEstimatedFee));
      setRejected(prev => { const next = { ...prev }; delete next[entry.contractId]; return next; });
      if (result?.hash) {
        setPendingTxHash(result.hash);
        rememberTransaction(result.hash);
      }
      // Reflect the new state without a page reload, as the issue requires —
      // the registry read is eventually consistent behind the ledger, so
      // trusting the confirmed transaction is more accurate than re-reading
      // immediately.
      setEntries((prev) =>
        prev.map((e) =>
          e.contractId === entry.contractId ? { ...e, active: false } : e,
        ),
      );
      onChanged?.();
      refreshHistory();
      refreshStake(entry.contractId);
    } catch (err) {
      if (err instanceof WalletRejectedError) {
        setRejected(prev => ({ ...prev, [entry.contractId]: {
          owner: walletAddress,
          retry: () => handleDeactivate(entry, err.retry),
        } }));
        return;
      }
      setRejected(prev => { const next = { ...prev }; delete next[entry.contractId]; return next; });
      const message =
        err instanceof ContractCallError
          ? err.message
          : err instanceof Error
            ? err.message
            : t("owner.deactivationFailed");
      setRowError((prev) => ({ ...prev, [entry.contractId]: message }));
      if (pendingTxHash) {
        rememberTransaction(pendingTxHash);
      }
    } finally {
      setPendingId(null);
      setPendingPhase("idle");
      setPendingTxHash(null);
    }
  }

  if (state === "loading") {
    return <InlineLoading label="Loading your contracts" />;
  }

  if (state === 'error') {
    return <BackendUnavailable onRetry={retry} />;
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        title="No contracts registered yet"
        description="Register one with the form to opt it into Lumina indexing."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {entries.map((entry) => {
        const entryHistory = historyFor(history, entry.contractId);
        const activityState = activity.get(entry.contractId) ?? "unknown";
        const reputation = reputations.get(entry.contractId);
        const isPending = pendingId === entry.contractId;
        const isOpen = expanded === entry.contractId;
        const info = stakeInfo[entry.contractId];
        const blockers = withdrawBlockers(entry, info);
        // The query is owner-scoped, but that is not what keeps these controls
        // from another wallet's entry: the entry itself has to name the
        // connected wallet, or the controls are not rendered at all.
        const isOwner = entry.owner === walletAddress;

        return (
          <div
            key={entry.contractId}
            className="border border-[var(--color-border-default)] rounded-xl p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-[var(--color-text-primary)]">
                    {entry.name}
                  </span>
                  <StatusPill active={entry.active} />
                  <ActivityPill state={activityState} />
                  {reputation && reputation.verified && <VerifiedBadge />}
                  {reputation && <StakeBadge stake={reputation.stake} />}
                  {reputation && (
                    <LifetimeSlashedBadge
                      slashedTotal={reputation.slashedTotal}
                    />
                  )}
                </div>
                <p className="text-[11px] mt-1 break-all">
                  <ContractLink contractId={entry.contractId} truncate={6} />
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1.5">
                  {entry.description}
                </p>
              </div>

              {entry.active && isOwner && (
                <button
                  onClick={() => handleDeactivate(entry)}
                  disabled={isPending}
                  className="shrink-0 border border-[var(--color-border-default)] hover:border-[var(--color-error-text)] hover:text-[var(--color-error-text)] disabled:opacity-50 text-[var(--color-text-secondary)] font-bold text-xs px-3 py-2 rounded-lg transition-colors"
                >
                  {isPending && pendingAction === "deactivate"
                    ? DEACTIVATE_LABELS[pendingPhase]
                    : t("owner.deactivate")}
                </button>
              )}
            </div>

            <div className="mt-3 border-t border-[var(--color-bg-overlay)] pt-3">
              <p className="text-xs text-[var(--color-text-secondary)] mb-2">
                Staked:{" "}
                <span className="mono">
                  {info ? info.stake.toString() : "—"}
                </span>
              </p>
              {isOwner && (
              <>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  inputMode="numeric"
                  aria-label={t("owner.stakeAmountLabel", { name: entry.name })}
                  placeholder={t("owner.stakeAmountPlaceholder")}
                  value={stakeInput[entry.contractId] ?? ""}
                  onChange={(e) => {
                    setRejected(prev => { const next = { ...prev }; delete next[entry.contractId]; return next; });
                    setStakeInput((prev) => ({
                      ...prev,
                      [entry.contractId]: e.target.value,
                    }));
                  }}
                  className="min-h-[34px] px-2.5 text-xs mono bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] rounded-lg w-44"
                />
                <button
                  onClick={() => handleStake(entry)}
                  disabled={pendingId !== null}
                  className="border border-[var(--color-border-default)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-accent-text)] disabled:opacity-50 text-[var(--color-text-secondary)] font-bold text-xs px-3 py-2 rounded-lg transition-colors"
                >
                  {isPending && pendingAction === "stake"
                    ? t("owner.staking")
                    : t("owner.stake")}
                </button>
                <button
                  onClick={() => handleWithdraw(entry)}
                  disabled={pendingId !== null || blockers.length > 0}
                  className="border border-[var(--color-border-default)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-accent-text)] disabled:opacity-50 text-[var(--color-text-secondary)] font-bold text-xs px-3 py-2 rounded-lg transition-colors"
                >
                  {isPending && pendingAction === "withdraw"
                    ? t("owner.withdrawing")
                    : t("owner.withdrawStake")}
                </button>
              </div>
              {blockers.length > 0 && (
                <ul className="mt-2 list-disc ps-4 text-[11px] text-[var(--color-warning-text)]">
                  {blockers.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
              </>
              )}
            </div>

            {isOwner && reserveWarning[entry.contractId] && (
              <div
                role="alert"
                className="mt-3 text-xs text-[var(--color-warning-text)] bg-[var(--color-warning-bg)] rounded-lg px-3 py-2 flex flex-col gap-2"
              >
                <p className="font-bold">{t("owner.reserveWarningTitle")}</p>
                <p>
                  {t("owner.reserveExplanation", {
                    remaining: formatStroops(
                      reserveWarning[entry.contractId].remaining > BigInt(0)
                        ? reserveWarning[entry.contractId].remaining
                        : BigInt(0),
                    ),
                    minimum: formatStroops(reserveWarning[entry.contractId].minimum),
                  })}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleStake(entry, true)}
                    disabled={pendingId !== null}
                    className="border border-[var(--color-border-default)] font-bold text-xs px-3 py-2 rounded-lg disabled:opacity-50"
                  >
                    {t("owner.stakeAnyway")}
                  </button>
                  <button
                    onClick={() =>
                      setReserveWarning((prev) => {
                        const next = { ...prev };
                        delete next[entry.contractId];
                        return next;
                      })
                    }
                    className="font-bold text-xs px-3 py-2 rounded-lg"
                  >
                    {t("common.cancel")}
                  </button>
                </div>
              </div>
            )}

            {rejected[entry.contractId]?.owner === walletAddress && (
              <div role="status" className="mt-3 text-xs text-[var(--color-text-secondary)]">
                <p>{t('soroban.rejectionPreserved')}</p>
                <button type="button" disabled={pendingId !== null} onClick={() => void rejected[entry.contractId].retry()} className="mt-2 font-bold underline">
                  {t('soroban.retrySignature')}
                </button>
              </div>
            )}
            {rowError[entry.contractId] && (
              <div
                role="alert"
                className="mt-3 text-xs text-[var(--color-error-text)] bg-[var(--color-error-bg)] rounded-lg px-3 py-2"
              >
                <p>{rowError[entry.contractId]}</p>
                <p className="mt-1">{transactionRecovery(rowError[entry.contractId])}</p>
              </div>
            )}

            {estimatedFee && isPending && (
              <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">
                {t("register.estimatedFee", { fee: formatStroops(estimatedFee) })}
              </p>
            )}

            <button
              onClick={() => toggleHistory(entry)}
              aria-expanded={isOpen}
              className="mt-3 text-[11px] font-bold text-[var(--color-accent-text)] hover:underline underline-offset-2"
            >
              {isOpen ? t("owner.hideHistory") : t("owner.historyCount", { count: entryHistory.length })}
            </button>

            {isOpen && (
              <div className="mt-2.5 border-t border-[var(--color-bg-overlay)] pt-2.5 flex flex-col gap-3">
                <ul className="flex flex-col gap-1.5" data-testid="history-list">
                  {entryHistory.length === 0 ? (
                    <li className="text-xs text-[var(--color-text-muted)]">
                      {t("owner.noRegistryEvents")}
                    </li>
                  ) : (
                    entryHistory.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-baseline justify-between gap-3"
                      >
                        <span className="text-xs text-[var(--color-text-primary)]">
                          {REGISTRY_EVENT_LABELS[item.type]}
                        </span>
                        <span className="mono text-[11px] text-[var(--color-text-muted)] shrink-0">
                          ledger {item.ledger} · <TimeAgo isoString={item.createdAt} />
                        </span>
                      </li>
                    ))
                  )}
                </ul>

                <section aria-label="Slash history">
                  <h4 className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.05em] mb-1.5">
                    {t("owner.slashHistory")}
                  </h4>
                  {reputation && reputation.slashedTotal > BigInt(0) && (
                    <p className="text-xs text-[var(--color-text-secondary)] mb-1.5">
                      Lifetime slashed:{" "}
                      <span className="mono">
                        {formatStroops(reputation.slashedTotal)} XLM
                      </span>
                    </p>
                  )}
                  {slashesLoading[entry.contractId] ? (
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {t("owner.loadingSlashHistory")}
                    </p>
                  ) : slashErrors[entry.contractId] ? (
                    <div role="alert" className="text-xs text-[var(--color-error-text)]">
                      <p>{slashErrors[entry.contractId]} Check your connection, then retry.</p>
                      <button type="button" onClick={() => void toggleHistory(entry, true)} className="mt-1 font-semibold underline underline-offset-2">Retry slash history</button>
                    </div>
                  ) : slashes[entry.contractId] &&
                    slashes[entry.contractId].length === 0 ? (
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {t("owner.noSlashes")}
                    </p>
                  ) : (
                    slashes[entry.contractId] && (
                      <ul className="flex flex-col gap-1.5" data-testid="slash-list">

                        {slashes[entry.contractId].map((slash, i) => (
                          <li
                            key={`${slash.slashedAt}-${i}`}
                            className="flex items-baseline justify-between gap-3"
                          >
                            <span className="text-xs text-[var(--color-text-primary)] min-w-0">
                              <span className="mono">
                                −{formatStroops(slash.amount)} XLM
                              </span>
                              <span className="text-[var(--color-text-secondary)]">
                                {" "}
                                · {slash.reason}
                              </span>
                            </span>
                            <span className="mono text-[11px] text-[var(--color-text-muted)] shrink-0">
                              ledger {slash.slashedAt.toLocaleString()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )
                  )}
                </section>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const DEACTIVATE_LABEL_KEYS: Record<TxPhase, Parameters<typeof t>[0]> = {
  idle: "owner.deactivate",
  building: "owner.preparing",
  "awaiting-signature": "owner.approveInWallet",
  submitting: "register.submitting",
  confirming: "register.confirming",
  success: "owner.deactivate",
  error: "owner.deactivate",
};
const DEACTIVATE_LABELS = new Proxy({} as Record<TxPhase, string>, {
  get(_target, prop: TxPhase) {
    return t(DEACTIVATE_LABEL_KEYS[prop]);
  },
});

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
        active ? "bg-[var(--color-active-bg)] text-[var(--color-active-text)]" : "bg-[var(--color-neutral-bg)] text-[var(--color-neutral-text)]"
      }`}
    >
      {active ? t("owner.active") : t("owner.deactivated")}
    </span>
  );
}

function ActivityPill({ state }: { state: ActivityState }) {
  const tone =
    state === "active"
      ? "bg-[var(--color-accent-surface)] text-[var(--color-accent-text)]"
      : state === "quiet"
        ? "bg-[var(--color-neutral-bg)] text-[var(--color-text-muted)]"
        : "bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]";

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tone}`}>
      {ACTIVITY_LABELS[state]}
    </span>
  );
}
