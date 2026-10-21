import { unstable_cache } from "next/cache";
import {
  getActiveProfiles,
  withCategories,
  REGISTRY_CONTRACT_ID,
  SOROBAN_RPC_URL,
  NETWORK_PASSPHRASE,
} from "@/lib/registry";

export const REGISTRY_CACHE_TAG = "registry-profiles";

// Shared public reads are independent of the connected wallet and URL filter.
const readProfiles = unstable_cache(
  async () =>
    (await withCategories(await getActiveProfiles())).map((profile) => ({
      ...profile,
      reputation: {
        ...profile.reputation,
        stake: profile.reputation.stake.toString(),
        slashedTotal: profile.reputation.slashedTotal.toString(),
      },
    })),
  [
    "registry-profiles-v1",
    REGISTRY_CONTRACT_ID,
    SOROBAN_RPC_URL,
    NETWORK_PASSPHRASE,
  ],
  { revalidate: 30, tags: [REGISTRY_CACHE_TAG] },
);

export async function getRegistryProfiles() {
  // Next's data cache serializes JSON; preserve i128 values without rounding.
  return (await readProfiles()).map((profile) => ({
    ...profile,
    reputation: {
      ...profile.reputation,
      stake: BigInt(profile.reputation.stake),
      slashedTotal: BigInt(profile.reputation.slashedTotal),
    },
  }));
}
