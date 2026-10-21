import { describe, expect, it, vi } from "vitest";

const load = vi.hoisted(() => vi.fn());
vi.mock("@/lib/registry", () => ({
  getActiveProfiles: load,
  withCategories: async (profiles: unknown) => profiles,
  REGISTRY_CONTRACT_ID: "contract",
  SOROBAN_RPC_URL: "rpc",
  NETWORK_PASSPHRASE: "network",
}));
vi.mock("next/cache", () => ({
  unstable_cache: (read: () => Promise<unknown>) => async () =>
    JSON.parse(JSON.stringify(await read())),
}));
import { getRegistryProfiles } from "./data";

describe("server registry data cache", () => {
  it("preserves i128 reputation values through the JSON cache without precision loss", async () => {
    const large = BigInt("170141183460469231731687303715884105727");
    const profile = {
      contractId: "C1",
      categories: ["DeFi"],
      reputation: {
        stake: large,
        slashedTotal: large - BigInt(1),
        verified: true,
        withdrawLockedUntil: 100,
      },
    };
    load.mockResolvedValue([profile]);
    expect(await getRegistryProfiles()).toEqual([profile]);
  });

  it("propagates a failed read so an unavailable response is not cached as an empty list", async () => {
    load.mockRejectedValueOnce(new Error("RPC unavailable"));
    await expect(getRegistryProfiles()).rejects.toThrow("RPC unavailable");
  });
});
