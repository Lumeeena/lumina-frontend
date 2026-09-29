/**
 * Wallet connection for the Registry page, via @creit.tech/stellar-wallets-kit —
 * gives users a choice of wallet (Freighter, xBull, Albedo, Rabet, Lobstr)
 * through one modal, rather than hard-coding to Freighter alone.
 *
 * The kit is loaded on first use, not at import: five wallet integrations and
 * their browser-only bundles are far more than the registry route needs for the
 * majority of visitors who never connect, so nothing here reaches the kit until
 * a wallet function is actually called. The loader memoises its promise, so
 * concurrent callers share one import and one init.
 */
import { NETWORK_PASSPHRASE } from './registry';
import { NETWORKS, type NetworkId } from './network';

type KitModule = typeof import('@creit.tech/stellar-wallets-kit');
type WalletsKit = KitModule['StellarWalletsKit'];

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

export interface NetworkMismatchError {
  error: string;
  walletNetwork: string;
  appNetwork: string;
  canSwitch: boolean;
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

let kitPromise: Promise<WalletsKit> | null = null;
let kitInitialized = false;

function loadKit(): Promise<WalletsKit> {
  if (!kitPromise) {
    kitPromise = importKit().catch((err) => {
      // A chunk that failed to arrive (flaky network, offline) must not poison
      // every later attempt — drop it so the next click imports again.
      kitPromise = null;
      throw err;
    });
  }
  return kitPromise;
}

async function importKit(): Promise<WalletsKit> {
  const [
    { StellarWalletsKit, Networks },
    { FreighterModule },
    { xBullModule },
    { AlbedoModule },
    { RabetModule },
    { LobstrModule },
  ] = await Promise.all([
    import('@creit.tech/stellar-wallets-kit'),
    import('@creit.tech/stellar-wallets-kit/modules/freighter'),
    import('@creit.tech/stellar-wallets-kit/modules/xbull'),
    import('@creit.tech/stellar-wallets-kit/modules/albedo'),
    import('@creit.tech/stellar-wallets-kit/modules/rabet'),
    import('@creit.tech/stellar-wallets-kit/modules/lobstr'),
  ]);

  if (!kitInitialized) {
    // Determine the correct network based on NETWORK_PASSPHRASE
    let network: string;
    if (NETWORK_PASSPHRASE === NETWORKS[0].passphrase) {
      network = Networks.PUBLIC; // mainnet
    } else if (NETWORK_PASSPHRASE === NETWORKS[1].passphrase) {
      network = Networks.TESTNET; // testnet
    } else if (NETWORK_PASSPHRASE === NETWORKS[2].passphrase) {
      network = Networks.FUTURENET; // futurenet
    } else {
      // Default to testnet for unknown passphrases
      network = Networks.TESTNET;
    }
    
    StellarWalletsKit.init({
      network,
      modules: [new FreighterModule(), new xBullModule(), new AlbedoModule(), new RabetModule(), new LobstrModule()],
    });
    kitInitialized = true;
  }

  return StellarWalletsKit;
}

/** Opens the wallet-picker modal; resolves once the user connects a wallet. */
export async function connectWallet(): Promise<{ address: string } | { error: string; isLocked?: boolean }> {
  try {
    const kit = await loadKit();
    const { address } = await kit.authModal();
    return { address };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Wallet connection was cancelled.';
    const isLocked = detectLockedWallet(message, err);
    return { error: message, isLocked };
  }
}

function detectLockedWallet(message: string, err: unknown): boolean {
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('locked')) return true;
  if (lowerMessage.includes('not unlocked')) return true;
  if (lowerMessage.includes('extension not active')) return false;
  if (lowerMessage.includes('extension not found')) return false;
  if (lowerMessage.includes('not installed')) return false;
  if (lowerMessage.includes('no extension')) return false;

  const errStr = String(err).toLowerCase();
  return errStr.includes('locked') || errStr.includes('not unlocked');
}

/** Returns the already-connected address without opening the modal, or null if none. */
export async function getConnectedAddress(): Promise<string | null> {
  try {
    const kit = await loadKit();
    const { address } = await kit.getAddress();
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
  try {
    const kit = await loadKit();
    const { address } = await kit.getAddress();
    if (!address) return null;
    const mod = kit.selectedModule;
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
): Promise<{ signedTxXdr: string } | { error: string }> {
  // Check for network mismatch before signing
  const mismatch = await checkNetworkMismatch();
  if (mismatch) {
    return { error: mismatch.error };
  }
  
  const kit = await loadKit();
  return kit.signTransaction(xdr, opts);
}

export async function disconnectWallet(): Promise<void> {
  const kit = await loadKit();
  await kit.disconnect();
}

/**
 * Get the network the wallet is currently configured for.
 * Returns the network ID or null if it cannot be determined.
 * This is a best-effort check since not all wallets expose their network.
 */
async function getWalletNetwork(): Promise<NetworkId | null> {
  try {
    const kit = await loadKit();
    // Try to get network from the kit - this may not be available in all wallet implementations
    // @ts-ignore - network property may not be in types
    const network = kit.network || kit._network;
    
    // Map StellarWalletsKit network strings to our NetworkId
    if (network === 'PUBLIC') return 'mainnet';
    if (network === 'TESTNET') return 'testnet';
    if (network === 'FUTURENET') return 'futurenet';
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if the wallet is on the correct network for the app.
 * Returns a mismatch error if networks don't match, null if they match or cannot be determined.
 */
export async function checkNetworkMismatch(): Promise<NetworkMismatchError | null> {
  const walletNetwork = await getWalletNetwork();
  
  if (!walletNetwork) {
    // Cannot determine wallet network - proceed with caution
    // This is common with some wallets that don't expose network info
    return null;
  }
  
  // Find the app's expected network from NETWORK_PASSPHRASE
  const appNetworkInfo = NETWORKS.find(n => n.passphrase === NETWORK_PASSPHRASE);
  const appNetwork = appNetworkInfo?.id || 'mainnet';
  
  if (walletNetwork !== appNetwork) {
    const walletNetworkInfo = NETWORKS.find(n => n.id === walletNetwork);
    return {
      error: `Network mismatch: your wallet is on ${walletNetworkInfo?.label || walletNetwork} but this app is configured for ${appNetworkInfo?.label || appNetwork}. Please switch your wallet network in your wallet settings.`,
      walletNetwork: walletNetworkInfo?.label || walletNetwork,
      appNetwork: appNetworkInfo?.label || appNetwork,
      canSwitch: true, // Most wallets support network switching via their UI
    };
  }
  
  return null;
}

/**
 * Get human-readable network information for the current app configuration.
 */
export function getAppNetworkInfo() {
  const appNetworkInfo = NETWORKS.find(n => n.passphrase === NETWORK_PASSPHRASE);
  return appNetworkInfo || NETWORKS[0]; // Default to mainnet
}
