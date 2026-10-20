"use server";

import { refresh, updateTag } from "next/cache";
import { REGISTRY_CACHE_TAG } from "./data";

/** Only invalidates public read data; on-chain writes remain wallet-authorized. */
export async function refreshRegistry() {
  updateTag(REGISTRY_CACHE_TAG);
  refresh();
}
