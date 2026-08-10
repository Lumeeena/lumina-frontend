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
