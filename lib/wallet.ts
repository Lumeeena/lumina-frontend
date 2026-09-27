/**
 * Wallet connection for the Registry page, via @creit.tech/stellar-wallets-kit —
 * gives users a choice of wallet (Freighter, xBull, Albedo, Rabet, Lobstr)
 * through one modal, rather than hard-coding to Freighter alone.
 */
import { Networks, StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';
import { AlbedoModule } from '@creit.tech/stellar-wallets-kit/modules/albedo';
import { FreighterModule } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import { LobstrModule } from '@creit.tech/stellar-wallets-kit/modules/lobstr';
import { RabetModule } from '@creit.tech/stellar-wallets-kit/modules/rabet';
import { xBullModule } from '@creit.tech/stellar-wallets-kit/modules/xbull';
import { NETWORK_PASSPHRASE } from './registry';

const KIT_NETWORK = NETWORK_PASSPHRASE === Networks.PUBLIC ? Networks.PUBLIC : Networks.TESTNET;

/**
 * localStorage keys the kit uses to persist its session.  Reading them
 * synchronously lets the UI avoid a flash of the "disconnected" state on every
 * reload — we know before any async call whether a session is likely present.
 */
const LS_ADDRESS = '@StellarWalletsKit/activeAddress';
const LS_MODULE_ID = '@StellarWalletsKit/selectedModuleId';

export interface WalletSession {
  address: string;
  walletId: string;
  walletName: string;
  walletIcon: string;
}

/**
 * Reads the kit's persisted session from localStorage synchronously.
 * Returns null when no session exists or in a non-browser context.
 * Use this to seed initial state and avoid a flash of disconnected UI.
 */
export function readPersistedSession(): { address: string; walletId: string } | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const address = localStorage.getItem(LS_ADDRESS);
    const walletId = localStorage.getItem(LS_MODULE_ID);
    if (!address || !walletId) return null;
    return { address, walletId };
  } catch {
    return null;
  }
}

let initialized = false;

function ensureInit() {
  if (initialized) return;
  StellarWalletsKit.init({
    network: KIT_NETWORK,
    modules: [new FreighterModule(), new xBullModule(), new AlbedoModule(), new RabetModule(), new LobstrModule()],
  });
  initialized = true;
}

/** Opens the wallet-picker modal; resolves once the user connects a wallet. */
export async function connectWallet(): Promise<{ address: string } | { error: string }> {
  ensureInit();
  try {
    const { address } = await StellarWalletsKit.authModal();
    return { address };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Wallet connection was cancelled.' };
  }
}

/** Returns the already-connected address without opening the modal, or null if none. */
export async function getConnectedAddress(): Promise<string | null> {
  ensureInit();
  try {
    const { address } = await StellarWalletsKit.getAddress();
    return address || null;
  } catch {
    return null;
  }
}

/**
 * Returns the full wallet session — address, id, name, and icon — by
 * confirming the persisted session with the kit and then reading the selected
 * module's product metadata.  Returns null when nothing is connected.
 */
export async function getConnectedWallet(): Promise<WalletSession | null> {
  ensureInit();
  try {
    const { address } = await StellarWalletsKit.getAddress();
    if (!address) return null;
    const mod = StellarWalletsKit.selectedModule();
    return {
      address,
      walletId: mod.productId,
      walletName: mod.productName,
      walletIcon: mod.productIcon,
    };
  } catch {
    return null;
  }
}

export async function signWithWallet(
  xdr: string,
  opts: { networkPassphrase: string; address: string }
): Promise<{ signedTxXdr: string }> {
  ensureInit();
  return StellarWalletsKit.signTransaction(xdr, opts);
}

export async function disconnectWallet(): Promise<void> {
  ensureInit();
  await StellarWalletsKit.disconnect();
}
