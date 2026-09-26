/**
 * Reads from the Lumina Registry contract via Soroban RPC simulateTransaction
 * (read-only — no signing/secret key needed). Same pattern as
 * lumina-backend/indexer/src/registry.ts, reimplemented here since the two
 * repos don't share code, and extended to return full entries (not just
 * contract IDs) for display.
 *
 * Reputation (stake, verification, slash history) is read through the same
 * plumbing: `get_active_profiles` attaches it to every entry in one call, and
 * `get_reputation` / `get_slashes` read it for a single contract. The single
 * reads are the tolerant views — the contract returns zeroed values for an
 * unregistered address rather than erroring, which is the truth for a contract
 * that was never registered.
 */
import { Contract, nativeToScVal, rpc, scValToNative, TransactionBuilder, xdr } from '@stellar/stellar-sdk';

export const REGISTRY_CONTRACT_ID =
  process.env.NEXT_PUBLIC_REGISTRY_CONTRACT_ID ?? 'CAYUDQPV3RKPM3EXDFGI3457FV677JLUCJ4OLKWGCUBPRIHYKXK3WFAZ';
export const SOROBAN_RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? 'https://soroban-testnet.stellar.org';
export const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ?? 'Test SDF Network ; September 2015';
// Any funded testnet account works here — simulation doesn't sign or spend.
const DEFAULT_READ_ACCOUNT =
  process.env.NEXT_PUBLIC_REGISTRY_READ_ACCOUNT ?? 'GBWKFFXZ5CJESIHP2EOID5IOXMF472RO5XOJ36X475D5LJGI3AF5R5KY';

export interface RegistryEntry {
  contractId: string;
  owner: string;
  name: string;
  description: string;
  active: boolean;
  registeredAt: number;
  /** Absent until read; empty for registrations that predate the taxonomy. */
  categories?: Category[];
}

/** The contract's `Category` vocabulary, in declaration order. */
export const CATEGORIES = [
  'DeFi',
  'Nft',
  'Gaming',
  'Identity',
  'Infrastructure',
  'Payments',
  'Oracle',
  'Dao',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  DeFi: 'DeFi',
  Nft: 'NFT',
  Gaming: 'Gaming',
  Identity: 'Identity',
  Infrastructure: 'Infrastructure',
  Payments: 'Payments',
  Oracle: 'Oracle',
  Dao: 'DAO',
  Other: 'Other',
};

export function isCategory(value: string | null | undefined): value is Category {
  return CATEGORIES.some(c => c === value);
}

/** A unit-variant `#[contracttype]` enum crosses the wire as `ScVec[Symbol]`. */
const categoryToScVal = (category: Category) => xdr.ScVal.scvVec([xdr.ScVal.scvSymbol(category)]);

interface ContractEntryScVal {
  active: boolean;
  contract_id: string;
  description: string;
  name: string;
  owner: string;
  registered_at: number;
  reputation?: ReputationScVal;
}

interface SlashRecordScVal {
  amount: bigint;
  reason: string;
  slashed_at: number;
}

const PAGE_LIMIT = 50;
const MAX_PAGES = 20;

/** Registry reads that take the same trailing `(offset, limit)` pagination pair. */
interface RegistryView {
  method: string;
  leadingArgs: xdr.ScVal[];
  decode: (entry: ContractEntryScVal) => unknown;
}

/**
 * One simulated read against the registry contract.
 *
 * Every view goes through here: the transaction is built identically for a
 * paged list and a single-value read, and a failed simulation is always an
 * error worth surfacing rather than data.
 */
async function simulate(
  method: string,
  args: xdr.ScVal[],
  registryContractId: string,
  rpcUrl: string,
  readAccount: string,
  networkPassphrase: string
): Promise<xdr.ScVal> {
  const server = new rpc.Server(rpcUrl);
  const account = await server.getAccount(readAccount);
  const contract = new Contract(registryContractId);
  const tx = new TransactionBuilder(account, { fee: '100', networkPassphrase })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(`Registry simulation failed: ${sim.error}`);
  }
  return sim.result!.retval;
}

/**
 * Page through any registry view that takes trailing `(offset, limit)` and
 * returns a vec — `get_active_contracts`, `get_active_profiles` and
 * `get_contracts_by_owner` share exactly that shape.
 *
 * `leadingArgs` are whatever the method takes *before* the pagination pair.
 */
async function readEntryPages<T>(
  { method, leadingArgs, decode }: RegistryView & { decode: (entry: ContractEntryScVal) => T },
  registryContractId: string,
  rpcUrl: string,
  readAccount: string,
  networkPassphrase: string
): Promise<T[]> {
  const entries: T[] = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    const offset = page * PAGE_LIMIT;
    const retval = await simulate(
      method,
      [
        ...leadingArgs,
        nativeToScVal(offset, { type: 'u32' }),
        nativeToScVal(PAGE_LIMIT, { type: 'u32' }),
      ],
      registryContractId,
      rpcUrl,
      readAccount,
      networkPassphrase
    );

    const batch = scValToNative(retval) as ContractEntryScVal[];
    entries.push(...batch.map(decode));

    if (batch.length < PAGE_LIMIT) break;
  }

  return entries;
}

/**
 * Every contract `owner` has registered, **including deactivated ones**.
 *
 * That difference from {@link getActiveContracts} is the whole point of the
 * owner dashboard: an owner has to be able to see what they took down, not
 * just what is currently live. The contract's `get_contracts_by_owner`
 * deliberately does not filter on `active` for the same reason.
 */
export async function getContractsByOwner(
  owner: string,
  registryContractId: string = REGISTRY_CONTRACT_ID,
  rpcUrl: string = SOROBAN_RPC_URL,
  readAccount: string = DEFAULT_READ_ACCOUNT,
  networkPassphrase: string = NETWORK_PASSPHRASE
): Promise<RegistryEntry[]> {
  return readEntryPages(
    { method: 'get_contracts_by_owner', leadingArgs: [nativeToScVal(owner, { type: 'address' })], decode: toRegistryEntry },
    registryContractId,
    rpcUrl,
    readAccount,
    networkPassphrase
  );
}

export async function getActiveContracts(
  registryContractId: string = REGISTRY_CONTRACT_ID,
  rpcUrl: string = SOROBAN_RPC_URL,
  readAccount: string = DEFAULT_READ_ACCOUNT,
  networkPassphrase: string = NETWORK_PASSPHRASE
): Promise<RegistryEntry[]> {
  return readEntryPages(
    { method: 'get_active_contracts', leadingArgs: [], decode: toRegistryEntry },
    registryContractId,
    rpcUrl,
    readAccount,
    networkPassphrase
  );
}

/**
 * Active registrations in one category, filtered by the contract rather than
 * client-side so paging stays correct.
 */
export async function getActiveContractsByCategory(
  category: Category,
  registryContractId: string = REGISTRY_CONTRACT_ID,
  rpcUrl: string = SOROBAN_RPC_URL,
  readAccount: string = DEFAULT_READ_ACCOUNT,
  networkPassphrase: string = NETWORK_PASSPHRASE
): Promise<RegistryEntry[]> {
  return readEntryPages(
    'get_active_contracts_by_category',
    [categoryToScVal(category)],
    registryContractId,
    rpcUrl,
    readAccount,
    networkPassphrase
  );
}

/**
 * Attach each entry's categories via `get_categories`. Categories are
 * decoration, so a failed read leaves the entries as they were rather than
 * failing the listing.
 */
export async function withCategories(
  entries: RegistryEntry[],
  registryContractId: string = REGISTRY_CONTRACT_ID,
  rpcUrl: string = SOROBAN_RPC_URL,
  readAccount: string = DEFAULT_READ_ACCOUNT,
  networkPassphrase: string = NETWORK_PASSPHRASE
): Promise<RegistryEntry[]> {
  if (entries.length === 0) return entries;
  try {
    const server = new rpc.Server(rpcUrl);
    const account = await server.getAccount(readAccount);
    const contract = new Contract(registryContractId);

    return await Promise.all(
      entries.map(async entry => {
        const tx = new TransactionBuilder(account, { fee: '100', networkPassphrase })
          .addOperation(contract.call('get_categories', nativeToScVal(entry.contractId, { type: 'address' })))
          .setTimeout(30)
          .build();
        const sim = await server.simulateTransaction(tx);
        if (rpc.Api.isSimulationError(sim)) return entry;
        const raw = scValToNative(sim.result!.retval) as (string | string[])[];
        const categories = raw.map(c => (Array.isArray(c) ? c[0] : c)).filter(isCategory);
        return { ...entry, categories };
      })
    );
  } catch {
    return entries;
  }
}

/** What an owner has staked on a registration and when it can come out. */
export interface StakeInfo {
  /** Staked balance in the stake token's base units. */
  stake: bigint;
  /** Ledger before which `withdraw_stake` is refused; 0 once clear. */
  withdrawLockedUntil: number;
  /** The network's current ledger, to compare the lock against. */
  currentLedger: number;
}

export async function getStakeInfo(
  contractId: string,
  registryContractId: string = REGISTRY_CONTRACT_ID,
  rpcUrl: string = SOROBAN_RPC_URL,
  readAccount: string = DEFAULT_READ_ACCOUNT,
  networkPassphrase: string = NETWORK_PASSPHRASE
): Promise<StakeInfo> {
  const server = new rpc.Server(rpcUrl);
  const account = await server.getAccount(readAccount);
  const tx = new TransactionBuilder(account, { fee: '100', networkPassphrase })
    .addOperation(
      new Contract(registryContractId).call('get_reputation', nativeToScVal(contractId, { type: 'address' }))
    )
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(`Registry simulation failed: ${sim.error}`);
  }
  const rep = scValToNative(sim.result!.retval) as { stake: bigint; withdraw_locked_until: number };
  const { sequence } = await server.getLatestLedger();

  return {
    stake: BigInt(rep.stake),
    withdrawLockedUntil: rep.withdraw_locked_until,
    currentLedger: sequence,
  };
}

/**
 * Page through any registry view that takes trailing `(offset, limit)` and
 * returns `ContractEntry`s — `get_active_contracts`,
 * `get_active_contracts_by_category` and `get_contracts_by_owner` share
 * exactly that shape.
 *
 * `leadingArgs` are whatever the method takes *before* the pagination pair.
 */
export async function getActiveProfiles(
  registryContractId: string = REGISTRY_CONTRACT_ID,
  rpcUrl: string = SOROBAN_RPC_URL,
  readAccount: string = DEFAULT_READ_ACCOUNT,
  networkPassphrase: string = NETWORK_PASSPHRASE
): Promise<RegistryProfile[]> {
  return readEntryPages(
    { method: 'get_active_profiles', leadingArgs: [], decode: toRegistryProfile },
    registryContractId,
    rpcUrl,
    readAccount,
    networkPassphrase
  );
}

/**
 * The reputation signal for one registration.
 *
 * `get_reputation` returns zeroed values rather than erroring for an
 * unregistered address, so this never throws for a well-formed contract ID —
 * a contract that was never registered simply has no stake, no attestation
 * and no slashes, which is the truth.
 */
export async function getReputation(
  contractId: string,
  registryContractId: string = REGISTRY_CONTRACT_ID,
  rpcUrl: string = SOROBAN_RPC_URL,
  readAccount: string = DEFAULT_READ_ACCOUNT,
  networkPassphrase: string = NETWORK_PASSPHRASE
): Promise<RegistryReputation> {
  const retval = await simulate(
    'get_reputation',
    [nativeToScVal(contractId, { type: 'address' })],
    registryContractId,
    rpcUrl,
    readAccount,
    networkPassphrase
  );
  return toReputation(scValToNative(retval) as ReputationScVal);
}

/**
 * Every slash levied against a registration, oldest first.
 *
 * `get_slashes` is likewise tolerant of an unregistered address — an empty
 * vec is the truth there, not an error.
 */
export async function getSlashes(
  contractId: string,
  registryContractId: string = REGISTRY_CONTRACT_ID,
  rpcUrl: string = SOROBAN_RPC_URL,
  readAccount: string = DEFAULT_READ_ACCOUNT,
  networkPassphrase: string = NETWORK_PASSPHRASE
): Promise<SlashRecord[]> {
  const retval = await simulate(
    'get_slashes',
    [nativeToScVal(contractId, { type: 'address' })],
    registryContractId,
    rpcUrl,
    readAccount,
    networkPassphrase
  );
  return (scValToNative(retval) as SlashRecordScVal[]).map(toSlashRecord);
}

export function toRegistryEntry(e: ContractEntryScVal): RegistryEntry {
  return {
    contractId: e.contract_id,
    owner: e.owner,
    name: e.name,
    description: e.description,
    active: e.active,
    registeredAt: e.registered_at,
  };
}

export function toRegistryProfile(e: ContractEntryScVal): RegistryProfile {
  return { ...toRegistryEntry(e), reputation: toReputation(e.reputation ?? zeroReputation()) };
}

export function toReputation(r: ReputationScVal): RegistryReputation {
  return {
    stake: r.stake,
    verified: r.verified,
    slashedTotal: r.slashed_total,
    withdrawLockedUntil: r.withdraw_locked_until,
  };
}

export function toSlashRecord(s: SlashRecordScVal): SlashRecord {
  return {
    amount: s.amount,
    reason: s.reason,
    slashedAt: s.slashed_at,
  };
}

/** What the contract stores for a registration that has no reputation record yet. */
function zeroReputation(): ReputationScVal {
  // BigInt literals need an ES2020 target; this project builds for ES2017.
  return { stake: BigInt(0), verified: false, slashed_total: BigInt(0), withdraw_locked_until: 0 };
}
