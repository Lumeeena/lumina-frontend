/**
 * Developer API Keys & Quota Management — protected behind wallet ownership.
 * Part of #8 / #78.
 *
 * Identity Design (#78):
 * The app's primary identity is a connected Stellar wallet. Developer API keys
 * and quota statistics are tied directly to the owner's connected wallet address.
 * Key management routes require an active wallet session. Disconnecting the wallet
 * immediately hides API key visibility without deleting the keys, allowing the owner
 * to access them again upon reconnecting.
 */

export interface DeveloperKey {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
  usage: number;
  limit: number;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function getStorage(): StorageLike | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function getKeyStorageKey(walletAddress: string): string {
  return `lumina.developerKeys.${walletAddress.trim().toUpperCase()}`;
}

const DEFAULT_LIMIT = 10000;

function createDefaultKeys(walletAddress: string): DeveloperKey[] {
  const short = walletAddress.slice(0, 4) + "…" + walletAddress.slice(-4);
  return [
    {
      id: `key-prod-${walletAddress.slice(0, 8)}`,
      name: `Production Key (${short})`,
      key: `lum_live_${walletAddress.slice(0, 6)}...${walletAddress.slice(-6)}`,
      created: "Sep 1, 2026",
      lastUsed: "Today, 2:30 PM",
      usage: 8500,
      limit: DEFAULT_LIMIT,
    },
    {
      id: `key-dev-${walletAddress.slice(0, 8)}`,
      name: `Development Key (${short})`,
      key: `lum_dev_${walletAddress.slice(0, 6)}...${walletAddress.slice(-6)}`,
      created: "Sep 10, 2026",
      lastUsed: "Yesterday, 4:15 PM",
      usage: 1450,
      limit: DEFAULT_LIMIT,
    },
  ];
}

export function loadKeysForWallet(
  walletAddress: string,
  storage: StorageLike | null = getStorage(),
): DeveloperKey[] {
  if (!walletAddress) return [];
  const defaults = createDefaultKeys(walletAddress);
  if (!storage) return defaults;
  const storageKey = getKeyStorageKey(walletAddress);
  try {
    const raw = storage.getItem(storageKey);
    if (!raw) {
      storage.setItem(storageKey, JSON.stringify(defaults));
      return defaults;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return defaults;
  } catch {
    return defaults;
  }
}

export function createKeyForWallet(
  walletAddress: string,
  name: string,
  storage: StorageLike | null = getStorage(),
): DeveloperKey[] {
  if (!walletAddress) return [];
  const current = loadKeysForWallet(walletAddress, storage);
  const newKey: DeveloperKey = {
    id: `key-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: name.trim() || "New API Key",
    key: `lum_live_${Math.random().toString(36).substring(2, 12)}`,
    created: "Just now",
    lastUsed: "Never",
    usage: 0,
    limit: DEFAULT_LIMIT,
  };
  const updated = [...current, newKey];
  if (storage) {
    try {
      storage.setItem(getKeyStorageKey(walletAddress), JSON.stringify(updated));
    } catch {
      // Storage blocked or full
    }
  }
  return updated;
}

export function deleteKeyForWallet(
  walletAddress: string,
  keyId: string,
  storage: StorageLike | null = getStorage(),
): DeveloperKey[] {
  if (!walletAddress) return [];
  const current = loadKeysForWallet(walletAddress, storage);
  const updated = current.filter((k) => k.id !== keyId);
  if (storage) {
    try {
      storage.setItem(getKeyStorageKey(walletAddress), JSON.stringify(updated));
    } catch {
      // Storage blocked or full
    }
  }
  return updated;
}
