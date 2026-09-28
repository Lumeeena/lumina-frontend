'use client';

/**
 * The registration form, lifted out of `app/registry/page.tsx`.
 *
 * It moved for two reasons: the submit pipeline is now shared with the
 * deactivate flow (see `lib/sorobanTx.ts`), and the issue calls out that this
 * form has never had a test. As a component taking an injectable `register`, it
 * can have one.
 */
import { useEffect, useState } from 'react';
import { nativeToScVal } from '@stellar/stellar-sdk';
import { REGISTRY_CATEGORIES, type RegistryCategory } from '@/lib/categories';
import { NETWORK_PASSPHRASE, REGISTRY_CONTRACT_ID, SOROBAN_RPC_URL } from '@/lib/registry';
import { createStellarDriver, submitContractCall, type TxPhase } from '@/lib/sorobanTx';
import { formatStroops } from '@/lib/formatters';
import { Button } from '@/components/ui/Button';


export interface RegistrationInput {
  contractId: string;
  name: string;
  description: string;
  categories: RegistryCategory[];
}

export interface RegisterContractFormProps {
  walletAddress: string;
  register?: (
    input: RegistrationInput,
    owner: string,
    onPhase: (p: TxPhase) => void,
    wait?: (ms: number) => Promise<void>,
    onFeeEstimated?: (fee: string) => void
  ) => Promise<{ hash: string } | void>;
  /** Overrides transaction polling delay in integration tests. */
  transactionWait?: (ms: number) => Promise<void>;
  onRegistered?: () => void;
}

const defaultRegister = async (
  input: RegistrationInput,
  owner: string,
  onPhase: (p: TxPhase) => void,
  wait?: (ms: number) => Promise<void>,
  onFeeEstimated?: (fee: string) => void
) => {
  // Lazy so the browser-only wallet kit stays out of this module's import
  // graph — see the matching note in OwnerContracts.
  const { signWithWallet } = await import('@/lib/wallet');

  const result = await submitContractCall({
    driver: createStellarDriver({
      rpcUrl: SOROBAN_RPC_URL,
      networkPassphrase: NETWORK_PASSPHRASE,
      walletAddress: owner,
    }),
    call: {
      contractId: REGISTRY_CONTRACT_ID,
      method: 'register_contract',
      args: [
        nativeToScVal(owner, { type: 'address' }),
        nativeToScVal(input.contractId, { type: 'address' }),
        nativeToScVal(input.name, { type: 'string' }),
        nativeToScVal(input.description, { type: 'string' }),
        // The contract's fifth argument: a vec of category symbols. The
        // per-element type spec is what makes nativeToScVal emit symbols
        // rather than strings — a Soroban fieldless enum variant is a
        // symbol on the wire. The contract rejects an empty list
        // (`NoCategories`), which the form enforces before this runs.
        //
        // Ships with the contract upgrade that adds the argument: against the
        // pre-categories build this invocation fails simulation, so the two
        // releases are one deploy, not two (see the contract's DEPLOY.md).
        nativeToScVal(input.categories, { type: input.categories.map(() => 'symbol') }),
      ],
    },
    sign: signWithWallet,
    walletAddress: owner,
    networkPassphrase: NETWORK_PASSPHRASE,
    onPhase,
    onFeeEstimated,
    wait,
  });
  return { hash: result.hash };
};

const SUBMIT_LABELS: Record<TxPhase, string> = {
  idle: 'Register Contract',
  building: 'Preparing transaction…',
  'awaiting-signature': 'Approve in your wallet…',
  submitting: 'Submitting…',
  confirming: 'Confirming…',
  success: 'Register Contract',
  error: 'Register Contract',
};

export default function RegisterContractForm({
  walletAddress,
  register = defaultRegister,
  transactionWait,
  onRegistered,
}: RegisterContractFormProps) {
  const [contractId, setContractId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<RegistryCategory[]>([]);
  const [categoryError, setCategoryError] = useState('');
  const [phase, setPhase] = useState<TxPhase>('idle');
  const [message, setMessage] = useState('');
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [estimatedFee, setEstimatedFee] = useState<string | null>(null);

  const busy = phase === 'building' || phase === 'awaiting-signature' || phase === 'submitting' || phase === 'confirming';

  useEffect(() => {
    if (!busy) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [busy]);

  function toggleCategory(category: RegistryCategory) {
    setCategoryError('');
    setCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    const input: RegistrationInput = {
      contractId: contractId.trim(),
      name: name.trim(),
      description: description.trim() || 'No description provided.',
      categories,
    };
    if (!input.contractId || !input.name) return;
    // The contract rejects an empty category list (`NoCategories`), and a
    // silent no-op submit would leave the user wondering why nothing happened.
    if (input.categories.length === 0) {
      setCategoryError('Select at least one category.');
      return;
    }

    setMessage('');
    setEstimatedFee(null);
    setPhase('building');
    try {
      const result = await register(input, walletAddress, setPhase, transactionWait, setEstimatedFee);
      if (result?.hash) {
        setTransactionHash(result.hash);
        sessionStorage.setItem(`tx-${Date.now()}`, result.hash);
      }
      setPhase('success');
      setMessage(`${input.name} registered — Lumina will begin indexing shortly.`);
      setContractId('');
      setName('');
      setDescription('');
      setCategories([]);
      setTransactionHash(null);
      setEstimatedFee(null);
      onRegistered?.();
    } catch (err) {
      setPhase('error');
      setMessage(err instanceof Error ? err.message : 'Registration failed.');
      if (transactionHash) {
        sessionStorage.setItem(`tx-${Date.now()}`, transactionHash);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">

      <div>
        <label htmlFor="reg-contract-id" className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
          Contract ID
        </label>
        <input
          id="reg-contract-id"
          value={contractId}
          onChange={e => setContractId(e.target.value)}
          placeholder="CABC...EXAMPLE"
          className="w-full min-h-[42px] px-3 py-2 text-[13px] mono bg-[var(--color-bg-base)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)]"
          required
        />
      </div>

      <div>
        <label htmlFor="reg-name" className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
          Project Name
        </label>
        <input
          id="reg-name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="My Protocol"
          className="w-full min-h-[42px] px-3 py-2 text-sm bg-[var(--color-bg-base)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)]"
          required
        />
      </div>

      <div>
        <label htmlFor="reg-description" className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
          Description
        </label>
        <textarea
          id="reg-description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          placeholder="A DeFi protocol on Stellar"
          className="w-full px-3 py-2 text-sm bg-[var(--color-bg-base)] border border-[var(--color-border-default)] rounded-lg resize-y text-[var(--color-text-primary)]"
        />
      </div>

      <fieldset>
        <legend className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
          Categories <span className="text-[var(--color-text-muted)] font-normal">(pick at least one)</span>
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {REGISTRY_CATEGORIES.map(category => {
            const selected = categories.includes(category);
            return (
              <button
                key={category}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleCategory(category)}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-full border transition-colors ${
                  selected
                    ? 'bg-[var(--color-accent-3)] text-[var(--color-accent-11)] border-[var(--color-border-strong)]'
                    : 'bg-[var(--color-bg-base)] text-[var(--color-text-secondary)] border-[var(--color-border-default)] hover:border-[var(--color-border-strong)]'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
        {categoryError && (
          <p role="alert" className="text-xs text-[var(--color-error-text)] mt-1.5">
            {categoryError}
          </p>
        )}
      </fieldset>

      <Button
        type="submit"
        variant="primary"
        size="md"
        loading={busy}
        loadingText={SUBMIT_LABELS[phase]}
        className="mt-1 w-full"
      >
        {SUBMIT_LABELS[phase]}
      </Button>

      {estimatedFee && phase !== 'idle' && phase !== 'success' && (
        <p className="text-xs text-[var(--color-text-muted)] text-center">
          Estimated fee: {formatStroops(estimatedFee)} XLM
        </p>
      )}

      {phase === 'success' && (
        <div role="status" className="text-xs text-[var(--color-success-text)] bg-[var(--color-success-bg)] rounded-lg px-3 py-2.5">
          {message}
        </div>
      )}
      {phase === 'error' && (
        <div role="alert" className="text-xs text-[var(--color-error-text)] bg-[var(--color-error-bg)] rounded-lg px-3 py-2.5">
          {message}
        </div>
      )}
    </form>
  );
}
