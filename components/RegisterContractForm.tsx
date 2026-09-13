'use client';

/**
 * The registration form, lifted out of `app/registry/page.tsx`.
 *
 * It moved for two reasons: the submit pipeline is now shared with the
 * deactivate flow (see `lib/sorobanTx.ts`), and the issue calls out that this
 * form has never had a test. As a component taking an injectable `register`, it
 * can have one.
 */
import { useState } from 'react';
import { nativeToScVal } from '@stellar/stellar-sdk';
import { NETWORK_PASSPHRASE, REGISTRY_CONTRACT_ID, SOROBAN_RPC_URL } from '@/lib/registry';
import { createStellarDriver, submitContractCall, type TxPhase } from '@/lib/sorobanTx';
import { truncateAddress } from '@/lib/formatters';

export interface RegistrationInput {
  contractId: string;
  name: string;
  description: string;
}

export interface RegisterContractFormProps {
  walletAddress: string;
  register?: (input: RegistrationInput, owner: string, onPhase: (p: TxPhase) => void) => Promise<void>;
  onRegistered?: () => void;
}

const defaultRegister = async (
  input: RegistrationInput,
  owner: string,
  onPhase: (p: TxPhase) => void
) => {
  // Lazy so the browser-only wallet kit stays out of this module's import
  // graph — see the matching note in OwnerContracts.
  const { signWithWallet } = await import('@/lib/wallet');

  await submitContractCall({
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
      ],
    },
    sign: signWithWallet,
    walletAddress: owner,
    networkPassphrase: NETWORK_PASSPHRASE,
    onPhase,
  });
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
  onRegistered,
}: RegisterContractFormProps) {
  const [contractId, setContractId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phase, setPhase] = useState<TxPhase>('idle');
  const [message, setMessage] = useState('');

  const busy = phase === 'building' || phase === 'awaiting-signature' || phase === 'submitting' || phase === 'confirming';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    const input: RegistrationInput = {
      contractId: contractId.trim(),
      name: name.trim(),
      description: description.trim() || 'No description provided.',
    };
    if (!input.contractId || !input.name) return;

    setMessage('');
    // Enter the busy phase here rather than waiting for `register` to report
    // it. Deriving the double-submit guard from the callee's progress
    // callback means a submit path that never reports one leaves the button
    // live, and the second click spends real fees.
    setPhase('building');
    try {
      await register(input, walletAddress, setPhase);
      setPhase('success');
      setMessage(`${input.name} registered — Lumina will begin indexing shortly.`);
      setContractId('');
      setName('');
      setDescription('');
      onRegistered?.();
    } catch (err) {
      setPhase('error');
      setMessage(err instanceof Error ? err.message : 'Registration failed.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      <div className="text-xs text-[#6b6975] bg-white border border-[#e5e3ea] rounded-lg px-3 py-2 mono break-all">
        Connected: {truncateAddress(walletAddress, 6)}
      </div>

      <div>
        <label htmlFor="reg-contract-id" className="block text-xs font-semibold text-[#6b6975] mb-1.5">
          Contract ID
        </label>
        <input
          id="reg-contract-id"
          value={contractId}
          onChange={e => setContractId(e.target.value)}
          placeholder="CABC...EXAMPLE"
          className="w-full min-h-[42px] px-3 py-2 text-[13px] mono bg-white border border-[#e5e3ea] rounded-lg"
          required
        />
      </div>

      <div>
        <label htmlFor="reg-name" className="block text-xs font-semibold text-[#6b6975] mb-1.5">
          Project Name
        </label>
        <input
          id="reg-name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="My Protocol"
          className="w-full min-h-[42px] px-3 py-2 text-sm bg-white border border-[#e5e3ea] rounded-lg"
          required
        />
      </div>

      <div>
        <label htmlFor="reg-description" className="block text-xs font-semibold text-[#6b6975] mb-1.5">
          Description
        </label>
        <textarea
          id="reg-description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          placeholder="A DeFi protocol on Stellar"
          className="w-full px-3 py-2 text-sm bg-white border border-[#e5e3ea] rounded-lg resize-y"
        />
      </div>

      <button
        type="submit"
        disabled={busy}
        className="bg-[#8b5cf6] hover:bg-[#7c3aed] disabled:opacity-50 text-white font-bold text-sm py-3 rounded-lg mt-1 transition-colors"
      >
        {SUBMIT_LABELS[phase]}
      </button>

      {phase === 'success' && (
        <div role="status" className="text-xs text-[#16a34a] bg-[#f0fdf4] rounded-lg px-3 py-2.5">
          {message}
        </div>
      )}
      {phase === 'error' && (
        <div role="alert" className="text-xs text-[#dc2626] bg-[#fef2f2] rounded-lg px-3 py-2.5">
          {message}
        </div>
      )}
    </form>
  );
}
