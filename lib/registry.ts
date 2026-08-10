/**
 * Reads from the Lumina Registry contract via Soroban RPC simulateTransaction
 * (read-only — no signing/secret key needed). Same pattern as
 * lumina-backend/indexer/src/registry.ts, reimplemented here since the two
 * repos don't share code, and extended to return full entries (not just
 * contract IDs) for display.
 */
import { Contract, nativeToScVal, rpc, scValToNative, TransactionBuilder } from '@stellar/stellar-sdk';

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
}

interface ContractEntryScVal {
  active: boolean;
  contract_id: string;
  description: string;
  name: string;
  owner: string;
  registered_at: number;
}

const PAGE_LIMIT = 50;
const MAX_PAGES = 20;

export async function getActiveContracts(
  registryContractId: string = REGISTRY_CONTRACT_ID,
  rpcUrl: string = SOROBAN_RPC_URL,
  readAccount: string = DEFAULT_READ_ACCOUNT,
  networkPassphrase: string = NETWORK_PASSPHRASE
): Promise<RegistryEntry[]> {
  const server = new rpc.Server(rpcUrl);
  const account = await server.getAccount(readAccount);
  const contract = new Contract(registryContractId);
  const entries: RegistryEntry[] = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    const offset = page * PAGE_LIMIT;
    const tx = new TransactionBuilder(account, { fee: '100', networkPassphrase })
      .addOperation(
        contract.call(
          'get_active_contracts',
          nativeToScVal(offset, { type: 'u32' }),
          nativeToScVal(PAGE_LIMIT, { type: 'u32' })
        )
      )
      .setTimeout(30)
      .build();

    const sim = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(sim)) {
      throw new Error(`Registry simulation failed: ${sim.error}`);
    }

    const batch = scValToNative(sim.result!.retval) as ContractEntryScVal[];
    entries.push(
      ...batch.map(e => ({
        contractId: e.contract_id,
        owner: e.owner,
        name: e.name,
        description: e.description,
        active: e.active,
        registeredAt: e.registered_at,
      }))
    );

    if (batch.length < PAGE_LIMIT) break;
  }

  return entries;
}
