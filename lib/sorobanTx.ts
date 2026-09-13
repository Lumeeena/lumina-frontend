/**
 * The write path to a Soroban contract: simulate → assemble → sign → send →
 * poll, reported as phase transitions the UI can render.
 *
 * `app/registry/page.tsx` had this inline, which meant the deactivate flow this
 * dashboard needs would have been a second copy of the same twenty lines. It
 * also meant none of it was testable: driving it required a wallet extension
 * and a live network.
 *
 * So the pipeline depends on {@link ContractCallDriver} — the narrow slice of
 * RPC it actually uses — rather than on `@stellar/stellar-sdk` directly.
 * {@link createStellarDriver} is the real implementation; tests pass a fake and
 * exercise every branch, including the ones that only happen when a network
 * misbehaves.
 */
import {
  Contract,
  rpc,
  TransactionBuilder,
  type xdr,
} from '@stellar/stellar-sdk';

/** Where a submission has got to. Rendered directly as button labels. */
export type TxPhase =
  | 'idle'
  | 'building'
  | 'awaiting-signature'
  | 'submitting'
  | 'confirming'
  | 'success'
  | 'error';

export interface ContractCall {
  contractId: string;
  method: string;
  args: xdr.ScVal[];
}

/**
 * What {@link submitContractCall} needs from the network. Deliberately three
 * methods: anything wider and the fake in the tests stops being obviously
 * equivalent to the real thing.
 */
export interface ContractCallDriver {
  /** Simulate and assemble, returning prepared but unsigned XDR. */
  prepare(call: ContractCall): Promise<string>;
  /** Submit signed XDR. Returns the transaction hash. */
  send(signedXdr: string): Promise<string>;
  /** Poll a submitted transaction's status. */
  status(hash: string): Promise<string>;
}

export type SignFn = (
  xdr: string,
  opts: { networkPassphrase: string; address: string }
) => Promise<{ signedTxXdr: string }>;

export interface SubmitOptions {
  driver: ContractCallDriver;
  call: ContractCall;
  sign: SignFn;
  walletAddress: string;
  networkPassphrase: string;
  onPhase?: (phase: TxPhase) => void;
  /** Injected so tests don't spend real seconds waiting between polls. */
  wait?: (ms: number) => Promise<void>;
  pollIntervalMs?: number;
  maxPolls?: number;
}

export interface SubmitResult {
  hash: string;
}

/** A failure that already carries a message worth showing the user. */
export class ContractCallError extends Error {
  constructor(
    message: string,
    readonly phase: TxPhase
  ) {
    super(message);
    this.name = 'ContractCallError';
  }
}

const defaultWait = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/**
 * Run a contract write to completion.
 *
 * Throws {@link ContractCallError} on every failure path, tagged with the phase
 * it failed in, so the UI can say "you rejected this" rather than "something
 * went wrong". Callers get a resolved `hash` only once the network reports
 * SUCCESS — a PENDING transaction that never settles within `maxPolls` is a
 * failure here, because telling a user their contract is deactivated when it
 * might not be is worse than telling them to check back.
 */
export async function submitContractCall({
  driver,
  call,
  sign,
  walletAddress,
  networkPassphrase,
  onPhase,
  wait = defaultWait,
  pollIntervalMs = 2000,
  maxPolls = 15,
}: SubmitOptions): Promise<SubmitResult> {
  const phase = (next: TxPhase) => onPhase?.(next);

  phase('building');
  let prepared: string;
  try {
    prepared = await driver.prepare(call);
  } catch (err) {
    throw new ContractCallError(messageOf(err, 'Could not prepare the transaction.'), 'building');
  }

  phase('awaiting-signature');
  let signedTxXdr: string;
  try {
    ({ signedTxXdr } = await sign(prepared, { networkPassphrase, address: walletAddress }));
  } catch (err) {
    // The overwhelmingly common case here is the user closing the wallet
    // prompt, which is not an error worth a red banner full of stack trace.
    throw new ContractCallError(messageOf(err, 'Signature was declined in your wallet.'), 'awaiting-signature');
  }

  phase('submitting');
  let hash: string;
  try {
    hash = await driver.send(signedTxXdr);
  } catch (err) {
    throw new ContractCallError(messageOf(err, 'The network rejected the transaction.'), 'submitting');
  }

  phase('confirming');
  let status = 'PENDING';
  for (let i = 0; i < maxPolls; i++) {
    await wait(pollIntervalMs);
    try {
      status = await driver.status(hash);
    } catch {
      // A single failed poll is not a failed transaction — the submission
      // already succeeded. Keep polling; only the loop running out is fatal.
      continue;
    }
    if (status !== 'PENDING' && status !== 'NOT_FOUND') break;
  }

  if (status !== 'SUCCESS') {
    throw new ContractCallError(
      status === 'PENDING' || status === 'NOT_FOUND'
        ? 'The transaction was submitted but has not confirmed yet. Check again in a moment.'
        : `The transaction did not succeed (status: ${status}).`,
      'confirming'
    );
  }

  phase('success');
  return { hash };
}

function messageOf(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err) return err;
  return fallback;
}

export interface StellarDriverConfig {
  rpcUrl: string;
  networkPassphrase: string;
  /** Source account for the transaction — the connected wallet. */
  walletAddress: string;
  fee?: string;
}

/** The real driver, wrapping `@stellar/stellar-sdk`. */
export function createStellarDriver({
  rpcUrl,
  networkPassphrase,
  walletAddress,
  fee = '1000000',
}: StellarDriverConfig): ContractCallDriver {
  const server = new rpc.Server(rpcUrl);

  return {
    async prepare({ contractId, method, args }) {
      const account = await server.getAccount(walletAddress);
      const contract = new Contract(contractId);
      const tx = new TransactionBuilder(account, { fee, networkPassphrase })
        .addOperation(contract.call(method, ...args))
        .setTimeout(60)
        .build();

      const sim = await server.simulateTransaction(tx);
      if (rpc.Api.isSimulationError(sim)) {
        throw new Error(sim.error);
      }
      return rpc.assembleTransaction(tx, sim).build().toXDR();
    },

    async send(signedXdr) {
      const signedTx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
      const result = await server.sendTransaction(signedTx);
      if (result.status === 'ERROR') {
        throw new Error('The network rejected the transaction.');
      }
      return result.hash;
    },

    async status(hash) {
      const polled = await server.getTransaction(hash);
      return polled.status;
    },
  };
}
