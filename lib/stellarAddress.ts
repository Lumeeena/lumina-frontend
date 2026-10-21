// Stellar Ed25519 public keys & Soroban contract IDs are Strkey-encoded:
//   - Account IDs start with 'G' (56 chars)
//   - Contract IDs start with 'C' (56 chars)
//   - Base32 alphabet: A-Z and 2-7 (case-insensitive input is normalised to upper)

const STRKEY_REGEX = /^[GC][A-Z2-7]{55}$/;

export type AddressValidation =
  | { valid: true }
  | { valid: false; reason: "empty" }
  | { valid: false; reason: "malformed"; hint: string };

export function validateStellarAddress(raw: string): AddressValidation {
  if (!raw) return { valid: false, reason: "empty" };

  const address = raw.trim().toUpperCase();

  if (STRKEY_REGEX.test(address)) return { valid: true };

  // Build a human-readable hint so the user knows what to fix.
  const hints: string[] = [];

  if (!address.startsWith("G") && !address.startsWith("C")) {
    hints.push(`must start with "G" or "C" (starts with "${raw[0]}")`);
  }

  if (address.length !== 56) {
    hints.push(`must be 56 characters (got ${address.length})`);
  }

  const badChars = Array.from(new Set(address.replace(/[A-Z2-7]/g, "")));
  if (badChars.length > 0) {
    hints.push(`contains invalid characters: ${badChars.join(" ")}`);
  }

  return {
    valid: false,
    reason: "malformed",
    hint: hints.length > 0 ? hints.join("; ") : "not a valid Stellar account or contract ID",
  };
}

