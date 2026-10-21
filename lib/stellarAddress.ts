// Stellar Ed25519 public keys & Soroban contract IDs are Strkey-encoded:
//   - Account IDs start with 'G' (56 chars)
//   - Contract IDs start with 'C' (56 chars)
//   - Base32 alphabet: A-Z and 2-7 (case-insensitive input is normalised to upper)

const STRKEY_REGEX = /^[GC][A-Z2-7]{55}$/;

/**
 * Result returned by {@link validateStellarAddress}.
 * An invalid result distinguishes an empty input from a malformed address;
 * malformed results include a user-readable hint describing the format issue.
 */
export type AddressValidation =
  | { valid: true }
  | { valid: false; reason: "empty" }
  | { valid: false; reason: "malformed"; hint: string };

/**
 * Checks whether input has the expected StrKey text format for a Stellar
 * account ID (`G...`) or Soroban contract ID (`C...`). Use this for client-side
 * address-field validation before accepting or submitting an address.
 *
 * Input is trimmed and compared case-insensitively. An empty string returns
 * `reason: "empty"`; whitespace-only input is malformed after trimming. The
 * malformed result's `hint` is intended for display to the user. This checks
 * only prefix, length, and alphabet; it does not verify the StrKey checksum,
 * decode the identifier, or establish that the account or contract exists.
 *
 * @param raw The address text to validate.
 * @returns A valid result, an empty-input result, or a malformed result with a hint.
 */
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
    hint:
      hints.length > 0
        ? hints.join("; ")
        : "not a valid Stellar account or contract ID",
  };
}
