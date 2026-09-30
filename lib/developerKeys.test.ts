import { beforeEach, describe, expect, it } from "vitest";
import {
  createKeyForWallet,
  deleteKeyForWallet,
  getKeyStorageKey,
  loadKeysForWallet,
} from "./developerKeys";

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
  };
}

const WALLET_A = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVW2";
const WALLET_B = "SABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUVW2";

describe("developerKeys", () => {
  let storage: ReturnType<typeof memoryStorage>;

  beforeEach(() => {
    storage = memoryStorage();
  });

  it("seeds and loads default keys scoped to the wallet address", () => {
    const keysA = loadKeysForWallet(WALLET_A, storage);
    expect(keysA.length).toBeGreaterThan(0);
    expect(keysA[0].name).toContain("GABC");

    const keysB = loadKeysForWallet(WALLET_B, storage);
    expect(keysB.length).toBeGreaterThan(0);
    expect(keysB[0].name).toContain("SABC");

    // Scoped keys are separate for distinct wallets
    expect(storage.getItem(getKeyStorageKey(WALLET_A))).not.toEqual(
      storage.getItem(getKeyStorageKey(WALLET_B)),
    );
  });

  it("creates a new API key for a specific wallet", () => {
    const initial = loadKeysForWallet(WALLET_A, storage);
    const updated = createKeyForWallet(WALLET_A, "Custom Key", storage);

    expect(updated.length).toBe(initial.length + 1);
    expect(updated.some((k) => k.name === "Custom Key")).toBe(true);

    // Other wallet remains untouched
    const keysB = loadKeysForWallet(WALLET_B, storage);
    expect(keysB.some((k) => k.name === "Custom Key")).toBe(false);
  });

  it("deletes a key owned by a specific wallet", () => {
    const initial = loadKeysForWallet(WALLET_A, storage);
    const keyToDelete = initial[0];

    const updated = deleteKeyForWallet(WALLET_A, keyToDelete.id, storage);
    expect(updated.some((k) => k.id === keyToDelete.id)).toBe(false);
    expect(updated.length).toBe(initial.length - 1);
  });

  it("degrades gracefully when storage is null or blocked", () => {
    expect(loadKeysForWallet("", null)).toEqual([]);
    expect(loadKeysForWallet(WALLET_A, null).length).toBeGreaterThan(0);
    expect(createKeyForWallet("", "Test", null)).toEqual([]);
    expect(deleteKeyForWallet("", "key-1", null)).toEqual([]);
  });
});
