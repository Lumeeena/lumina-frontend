/**
 * The Registry's category vocabulary, mirrored 1:1 from the contract's
 * `Category` enum (lumina-contracts `registry/src/lib.rs`).
 *
 * The vocabulary is fixed on-chain: a registration is browsed under exactly
 * these names, and `register_contract` rejects anything else. Adding a
 * category is a contract upgrade, so this list and the enum can only change
 * together — see the contract's `DEPLOY.md`.
 */
export const REGISTRY_CATEGORIES = [
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

export type RegistryCategory = (typeof REGISTRY_CATEGORIES)[number];
