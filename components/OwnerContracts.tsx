'use client';

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
import { useCallback, useEffect, useState } from 'react';
import { nativeToScVal, type xdr } from '@stellar/stellar-sdk';
import {
  getContractsByOwner,
  getStakeInfo,
  NETWORK_PASSPHRASE,
  REGISTRY_CONTRACT_ID,
  type RegistryEntry,
  type RegistryReputation,
  type SlashRecord,
  SOROBAN_RPC_URL,
  type StakeInfo,
} from '@/lib/registry';
import {
  ContractCallError,
  createStellarDriver,
  submitContractCall,
  type TxPhase,
} from '@/lib/sorobanTx';
import { gqlFetch, PUBLIC_GRAPHQL_URL } from '@/lib/graphql';
import {
  historyFor,
  parseRegistryEvents,
  REGISTRY_EVENT_LABELS,
  type RegistryHistoryEntry,
} from '@/lib/registryHistory';
import {
  ACTIVITY_LABELS,
  probeContractActivity,
  type ActivityState,
} from '@/lib/contractActivity';
import type { ContractEvent } from '@/lib/types';
import { formatStroops, truncateAddress } from '@/lib/formatters';
import TimeAgo from './TimeAgo';
import { LifetimeSlashedBadge, StakeBadge, VerifiedBadge } from './RegistryBadges';
import BackendUnavailable from './BackendUnavailable';

const EVENTS_QUERY = `
  query ContractEvents($contractId: String!, $limit: Int) {
    events(contractId: $contractId, limit: $limit) {
      items { id type contractId ledger createdAt pagingToken topics value }
    }
  }
`;

async function fetchEvents(contractId: string, limit: number): Promise<ContractEvent[]> {
  const data = await gqlFetch<{ events: { items: ContractEvent[] } }>(
    PUBLIC_GRAPHQL_URL,
    EVENTS_QUERY,
    { contractId, limit }
  );
  return data.events.items;
}

export interface OwnerContractsProps {
  walletAddress: string;
  loadContracts?: (owner: string) => Promise<RegistryEntry[]>;
  loadHistory?: () => Promise<RegistryHistoryEntry[]>;
  loadActivity?: (contractIds: string[]) => Promise<Map<string, ActivityState>>;
  loadStake?: (contractId: string) => Promise<StakeInfo>;
  deactivate?: (contractId: string, owner: string) => Promise<void>;
  stake?: (contractId: string, owner: string, amount: bigint) => Promise<void>;
  withdraw?: (contractId: string, owner: string) => Promise<void>;
  /** Notifies the parent so the global list can refresh after a change. */
  onChanged?: () => void;
}

const defaultLoadContracts = (owner: string) => getContractsByOwner(owner);

const defaultLoadHistory = async () =>
  parseRegistryEvents(await fetchEvents(REGISTRY_CONTRACT_ID, 100));

const defaultLoadActivity = (contractIds: string[]) =>
  probeContractActivity(contractIds, id => fetchEvents(id, 1));

const defaultLoadStake = (contractId: string) => getStakeInfo(contractId);

async function callRegistry(owner: string, method: string, args: xdr.ScVal[]) {
  // Imported lazily rather than at module scope: the wallet kit pulls in
  // browser-only CommonJS (Freighter et al) that cannot be loaded outside a
  // browser, which would otherwise make this component untestable — the exact
  // problem the issue asks to solve. It also keeps the kit out of the page's
  // static bundle until someone actually signs something.
  const { signWithWallet } = await import('@/lib/wallet');

  await submitContractCall({
    driver: createStellarDriver({
      rpcUrl: SOROBAN_RPC_URL,
      networkPassphrase: NETWORK_PASSPHRASE,
      walletAddress: owner,
    }),
    call: { contractId: REGISTRY_CONTRACT_ID, method, args },
    sign: signWithWallet,
    walletAddress: owner,
    networkPassphrase: NETWORK_PASSPHRASE,
  });
}

const defaultDeactivate = (contractId: string, owner: string) =>
  callRegistry(owner, 'deactivate', [
    nativeToScVal(owner, { type: 'address' }),
    nativeToScVal(contractId, { type: 'address' }),
  ]);

const defaultStake = (contractId: string, owner: string, amount: bigint) =>
  callRegistry(owner, 'stake', [
    nativeToScVal(owner, { type: 'address' }),
    nativeToScVal(contractId, { type: 'address' }),
    nativeToScVal(amount, { type: 'i128' }),
  ]);

const defaultWithdraw = (contractId: string, owner: string) =>
  callRegistry(owner, 'withdraw_stake', [
    nativeToScVal(owner, { type: 'address' }),
    nativeToScVal(contractId, { type: 'address' }),
  ]);

/**
 * The unmet good-standing conditions for `withdraw_stake`, worked out up front
 * so the owner is told why it is blocked instead of meeting the contract's
 * error afterwards. Mirrors the contract's checks: deactivated, not within the
 * post-slash lock, and something to withdraw.
 */
export function withdrawBlockers(entry: RegistryEntry, info: StakeInfo | undefined): string[] {
  const blockers: string[] = [];
  if (entry.active) {
    blockers.push('Deactivate this registration first; stake can only be withdrawn once it is deactivated.');
  }
  if (info && info.withdrawLockedUntil > info.currentLedger) {
    blockers.push(
      `A slash landed recently, so withdrawal is locked until ledger ${info.withdrawLockedUntil} ` +
        `(currently ${info.currentLedger}, ${info.withdrawLockedUntil - info.currentLedger} to go).`
    );
  }
  if (info && info.stake <= BigInt(0)) {
    blockers.push('There is no stake to withdraw.');
  }
  return blockers;
}

type LoadState = 'loading' | 'ready' | 'error';

export default function OwnerContracts({
  walletAddress,
  loadContracts = defaultLoadContracts,
  loadHistory = defaultLoadHistory,
  loadActivity = defaultLoadActivity,
  loadStake = defaultLoadStake,
  deactivate = defaultDeactivate,
  stake = defaultStake,
  withdraw = defaultWithdraw,
  onChanged,
}: OwnerContractsProps) {
  const [entries, setEntries] = useState<RegistryEntry[]>([]);
  const [state, setState] = useState<LoadState>('loading');

  const [history, setHistory] = useState<RegistryHistoryEntry[]>([]);
  const [activity, setActivity] = useState<Map<string, ActivityState>>(new Map());
  const [reputations, setReputations] = useState<Map<string, RegistryReputation>>(new Map());
  const [slashes, setSlashes] = useState<Record<string, SlashRecord[]>>({});
  const [slashesLoading, setSlashesLoading] = useState<Record<string, boolean>>({});
  const [slashErrors, setSlashErrors] = useState<Record<string, string>>({});

  const [expanded, setExpanded] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingPhase, setPendingPhase] = useState<TxPhase>('idle');
  const [pendingAction, setPendingAction] = useState<'deactivate' | 'stake' | 'withdraw'>('deactivate');
  const [stakeInfo, setStakeInfo] = useState<Record<string, StakeInfo>>({});
  const [stakeInput, setStakeInput] = useState<Record<string, string>>({});
  const [rowError, setRowError] = useState<Record<string, string>>({});

  const applyLoaded = useCallback(
    (owned: RegistryEntry[], isCurrent: () => boolean) => {
      if (!isCurrent()) return;
      setEntries(owned);
      setState('ready');

      // History, activity and reputation are decoration: a registry read that
      // succeeded should render even if the indexer is unreachable, so these
      // are deliberately not chained onto the read above.
      loadHistory()
        .then(h => isCurrent() && setHistory(h))
        .catch(() => isCurrent() && setHistory([]));
      if (owned.length > 0) {
        loadActivity(owned.map(e => e.contractId))
          .then(a => isCurrent() && setActivity(a))
          .catch(() => isCurrent() && setActivity(new Map()));
        // Stake is decoration too: without it the controls still work, they
        // just cannot pre-explain a blocked withdrawal.
        owned.forEach(e =>
          loadStake(e.contractId)
            .then(info => isCurrent() && setStakeInfo(prev => ({ ...prev, [e.contractId]: info })))
            .catch(() => {})
        );
      }
    },
    [loadHistory, loadActivity, loadStake]
  );

  const applyError = useCallback((_err: unknown, isCurrent: () => boolean) => {
    if (!isCurrent()) return;
    setState('error');
  }, []);

  useEffect(() => {
    // The effect body only starts the fetch; every setState happens in a
    // settled-promise handler. `cancelled` stops a slow read writing into a
    // component that has since unmounted or switched wallet.
    let cancelled = false;
    const isCurrent = () => !cancelled;

    loadContracts(walletAddress).then(
      owned => applyLoaded(owned, isCurrent),
      err => applyError(err, isCurrent)
    );

    return () => {
      cancelled = true;
    };
  }, [walletAddress, loadContracts, applyLoaded, applyError]);

  /** Retry, driven by a click rather than an effect. */
  const retry = useCallback(() => {
    const isCurrent = () => true;
    setState('loading');
    setError(null);
    loadContracts(walletAddress).then(
      owned => applyLoaded(owned, isCurrent),
      err => applyError(err, isCurrent)
    );
  }, [walletAddress, loadContracts, applyLoaded, applyError]);

  function refreshStake(contractId: string) {
    loadStake(contractId)
      .then(info => setStakeInfo(prev => ({ ...prev, [contractId]: info })))
      .catch(() => {});
  }

  /** Shared by stake and withdraw: run a signed call, surface its error on the row. */
  async function runRowAction(
    entry: RegistryEntry,
    action: 'stake' | 'withdraw',
    work: () => Promise<void>,
    fallback: string
  ) {
    setPendingId(entry.contractId);
    setPendingAction(action);
    setPendingPhase('building');
    setRowError(prev => {
      const next = { ...prev };
      delete next[entry.contractId];
      return next;
    });

    try {
      await work();
      refreshStake(entry.contractId);
      loadHistory()
        .then(setHistory)
        .catch(() => {});
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : fallback;
      setRowError(prev => ({ ...prev, [entry.contractId]: message }));
    } finally {
      setPendingId(null);
      setPendingPhase('idle');
    }
  }

  async function handleStake(entry: RegistryEntry) {
    const raw = (stakeInput[entry.contractId] ?? '').trim();
    if (!/^\d+$/.test(raw) || BigInt(raw) <= BigInt(0)) {
      setRowError(prev => ({
        ...prev,
        [entry.contractId]: 'Enter a whole amount greater than zero, in the stake token’s base units.',
      }));
      return;
    }
    await runRowAction(entry, 'stake', () => stake(entry.contractId, walletAddress, BigInt(raw)), 'Staking failed.');
    setStakeInput(prev => ({ ...prev, [entry.contractId]: '' }));
  }

  const handleWithdraw = (entry: RegistryEntry) =>
    runRowAction(entry, 'withdraw', () => withdraw(entry.contractId, walletAddress), 'Withdrawal failed.');

  async function handleDeactivate(entry: RegistryEntry) {
    setPendingId(entry.contractId);
    setPendingAction('deactivate');
    setPendingPhase('building');
    setRowError(prev => {
      const next = { ...prev };
      delete next[entry.contractId];
      return next;
    });

    try {
      await deactivate(entry.contractId, walletAddress);
      // Reflect the new state without a page reload, as the issue requires —
      // the registry read is eventually consistent behind the ledger, so
      // trusting the confirmed transaction is more accurate than re-reading
      // immediately.
      setEntries(prev =>
        prev.map(e => (e.contractId === entry.contractId ? { ...e, active: false } : e))
      );
      onChanged?.();
      loadHistory()
        .then(setHistory)
        .catch(() => {});
      refreshStake(entry.contractId);
    } catch (err) {
      const message =
        err instanceof ContractCallError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Deactivation failed.';
      setRowError(prev => ({ ...prev, [entry.contractId]: message }));
    } finally {
      setPendingId(null);
      setPendingPhase('idle');
    }
  }

  if (state === 'loading') {
    return <p className="text-sm text-[#a6a3b0]">Loading your contracts…</p>;
  }

  if (state === 'error') {
    return <BackendUnavailable onRetry={retry} />;
  }

  if (entries.length === 0) {
    return (
      <div className="border border-[#e5e3ea] rounded-xl p-6 text-center">
        <p className="text-sm text-[#6b6975] mb-1">You haven&apos;t registered any contracts yet.</p>
        <p className="text-xs text-[#a6a3b0]">
          Register one with the form to opt it into Lumina indexing.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {entries.map(entry => {
        const entryHistory = historyFor(history, entry.contractId);
        const activityState = activity.get(entry.contractId) ?? 'unknown';
        const reputation = reputations.get(entry.contractId);
        const isPending = pendingId === entry.contractId;
        const isOpen = expanded === entry.contractId;
        const info = stakeInfo[entry.contractId];
        const blockers = withdrawBlockers(entry, info);

        return (
          <div key={entry.contractId} className="border border-[#e5e3ea] rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-[#0e0e12]">{entry.name}</span>
                  <StatusPill active={entry.active} />
                  <ActivityPill state={activityState} />
                  {reputation && reputation.verified && <VerifiedBadge />}
                  {reputation && <StakeBadge stake={reputation.stake} />}
                  {reputation && <LifetimeSlashedBadge slashedTotal={reputation.slashedTotal} />}
                </div>
                <p className="mono text-[11px] text-[#a6a3b0] mt-1 break-all">
                  {truncateAddress(entry.contractId, 6)}
                </p>
                <p className="text-xs text-[#6b6975] mt-1.5">{entry.description}</p>
              </div>

              {entry.active && (
                <button
                  onClick={() => handleDeactivate(entry)}
                  disabled={isPending}
                  className="shrink-0 border border-[#e5e3ea] hover:border-[#dc2626] hover:text-[#dc2626] disabled:opacity-50 text-[#6b6975] font-bold text-xs px-3 py-2 rounded-lg transition-colors"
                >
                  {isPending && pendingAction === 'deactivate' ? DEACTIVATE_LABELS[pendingPhase] : 'Deactivate'}
                </button>
              )}
            </div>

            <div className="mt-3 border-t border-[#f0eff3] pt-3">
              <p className="text-xs text-[#6b6975] mb-2">
                Staked: <span className="mono">{info ? info.stake.toString() : '—'}</span>
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  inputMode="numeric"
                  aria-label={`Stake amount for ${entry.name}`}
                  placeholder="Amount (base units)"
                  value={stakeInput[entry.contractId] ?? ''}
                  onChange={e => setStakeInput(prev => ({ ...prev, [entry.contractId]: e.target.value }))}
                  className="min-h-[34px] px-2.5 text-xs mono bg-[#fafafa] border border-[#e5e3ea] rounded-lg w-44"
                />
                <button
                  onClick={() => handleStake(entry)}
                  disabled={pendingId !== null}
                  className="border border-[#e5e3ea] hover:border-[#8b5cf6] hover:text-[#7c3aed] disabled:opacity-50 text-[#6b6975] font-bold text-xs px-3 py-2 rounded-lg transition-colors"
                >
                  {isPending && pendingAction === 'stake' ? 'Staking…' : 'Stake'}
                </button>
                <button
                  onClick={() => handleWithdraw(entry)}
                  disabled={pendingId !== null || blockers.length > 0}
                  className="border border-[#e5e3ea] hover:border-[#8b5cf6] hover:text-[#7c3aed] disabled:opacity-50 text-[#6b6975] font-bold text-xs px-3 py-2 rounded-lg transition-colors"
                >
                  {isPending && pendingAction === 'withdraw' ? 'Withdrawing…' : 'Withdraw stake'}
                </button>
              </div>
              {blockers.length > 0 && (
                <ul className="mt-2 list-disc pl-4 text-[11px] text-[#b45309]">
                  {blockers.map(b => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
            </div>

            {rowError[entry.contractId] && (
              <div
                role="alert"
                className="mt-3 text-xs text-[#dc2626] bg-[#fef2f2] rounded-lg px-3 py-2"
              >
                {rowError[entry.contractId]}
              </div>
            )}

            <button
              onClick={() => toggleHistory(entry)}
              aria-expanded={isOpen}
              className="mt-3 text-[11px] font-bold text-[#8b5cf6] hover:underline underline-offset-2"
            >
              {isOpen ? 'Hide history' : `History (${entryHistory.length})`}
            </button>

            {isOpen && (
              <div className="mt-2.5 border-t border-[#f0eff3] pt-2.5 flex flex-col gap-3">
                <ul className="flex flex-col gap-1.5">
                  {entryHistory.length === 0 ? (
                    <li className="text-xs text-[#a6a3b0]">
                      No registry events indexed for this contract yet.
                    </li>
                  ) : (
                    entryHistory.map(item => (
                      <li key={item.id} className="flex items-baseline justify-between gap-3">
                        <span className="text-xs text-[#0e0e12]">
                          {REGISTRY_EVENT_LABELS[item.type]}
                        </span>
                        <span className="mono text-[11px] text-[#a6a3b0] shrink-0">
                          ledger {item.ledger} · <TimeAgo isoString={item.createdAt} />
                        </span>
                      </li>
                    ))
                  )}
                </ul>

                <section aria-label="Slash history">
                  <h4 className="text-[11px] font-bold text-[#a6a3b0] uppercase tracking-[0.05em] mb-1.5">
                    Slash history
                  </h4>
                  {reputation && reputation.slashedTotal > BigInt(0) && (
                    <p className="text-xs text-[#6b6975] mb-1.5">
                      Lifetime slashed: <span className="mono">{formatStroops(reputation.slashedTotal)} XLM</span>
                    </p>
                  )}
                  {slashesLoading[entry.contractId] ? (
                    <p className="text-xs text-[#a6a3b0]">Loading slash history…</p>
                  ) : slashErrors[entry.contractId] ? (
                    <p role="alert" className="text-xs text-[#dc2626]">
                      {slashErrors[entry.contractId]}
                    </p>
                  ) : slashes[entry.contractId] && slashes[entry.contractId].length === 0 ? (
                    <p className="text-xs text-[#a6a3b0]">No slashes recorded.</p>
                  ) : (
                    slashes[entry.contractId] && (
                      <ul className="flex flex-col gap-1.5">
                        {slashes[entry.contractId].map((slash, i) => (
                          <li key={`${slash.slashedAt}-${i}`} className="flex items-baseline justify-between gap-3">
                            <span className="text-xs text-[#0e0e12] min-w-0">
                              <span className="mono">−{formatStroops(slash.amount)} XLM</span>
                              <span className="text-[#6b6975]"> · {slash.reason}</span>
                            </span>
                            <span className="mono text-[11px] text-[#a6a3b0] shrink-0">
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

const DEACTIVATE_LABELS: Record<TxPhase, string> = {
  idle: 'Deactivate',
  building: 'Preparing…',
  'awaiting-signature': 'Approve in wallet…',
  submitting: 'Submitting…',
  confirming: 'Confirming…',
  success: 'Deactivate',
  error: 'Deactivate',
};

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
        active ? 'bg-[#f0fdf4] text-[#16a34a]' : 'bg-[#f4f4f5] text-[#6b6975]'
      }`}
    >
      {active ? 'Active' : 'Deactivated'}
    </span>
  );
}

function ActivityPill({ state }: { state: ActivityState }) {
  const tone =
    state === 'active'
      ? 'bg-[#f5f3ff] text-[#7c3aed]'
      : state === 'quiet'
        ? 'bg-[#f4f4f5] text-[#a6a3b0]'
        : 'bg-[#fffbeb] text-[#b45309]';

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tone}`}>
      {ACTIVITY_LABELS[state]}
    </span>
  );
}
