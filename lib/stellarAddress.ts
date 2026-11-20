import { StrKey } from "@stellar/stellar-sdk";

// Stellar Ed25519 public keys & Soroban contract IDs are Strkey-encoded:
//   - Account IDs start with 'G' (56 chars)
//   - Contract IDs start with 'C' (56 chars)
//   - Muxed account IDs start with 'M' (69 chars, SEP-0023)
//   - Base32 alphabet: A-Z and 2-7 (case-insensitive input is normalised to upper)

const STRKEY_REGEX = /^[GC][A-Z2-7]{55}$/;
const MUXED_REGEX = /^M[A-Z2-7]{68}$/;

/**
 * Result returned by {@link validateStellarAddress}.
 * An invalid result distinguishes an empty input from a malformed address;
 * malformed results include a user-readable hint describing the format issue.
 */
export type AddressValidation =
  | { valid: true; muxed?: false }
  | { valid: true; muxed: true; baseAccount: string; muxedId: string }
  | { valid: false; reason: "empty" }
  | { valid: false; reason: "malformed"; hint: string };

/**
 * Checks whether input has the expected StrKey text format for a Stellar
 * account ID (`G...`), Soroban contract ID (`C...`), or muxed account
 * address (`M...`, SEP-0023). Use this for client-side address-field
 * validation before accepting or submitting an address.
 *
 * Input is trimmed and compared case-insensitively. An empty string returns
 * `reason: "empty"`; whitespace-only input is malformed after trimming.
 * M-addresses are verified against the StrKey checksum via the Stellar SDK;
 * G and C addresses are checked by prefix, length, and alphabet only.
 *
 * A valid muxed result includes the decoded `baseAccount` (G-address) and
 * the `muxedId` (uint64 as a decimal string) for display.
 *
 * @param raw The address text to validate.
 * @returns A valid result, an empty-input result, or a malformed result with a hint.
 */
export function validateStellarAddress(raw: string): AddressValidation {
  if (!raw) return { valid: false, reason: "empty" };

  const address = raw.trim().toUpperCase();

  if (STRKEY_REGEX.test(address)) return { valid: true };

  // Muxed account address (M..., 69 chars, SEP-0023)
  if (MUXED_REGEX.test(address)) {
    if (!StrKey.isValidMed25519PublicKey(address)) {
      return {
        valid: false,
        reason: "malformed",
        hint: "muxed address checksum is invalid",
      };
    }
    const components = decodeMuxedAddress(address);
    if (!components) {
      return { valid: false, reason: "malformed", hint: "could not decode muxed address" };
    }
    return { valid: true, muxed: true, ...components };
  }

  // Build a human-readable hint so the user knows what to fix.
  const hints: string[] = [];

  if (!address.startsWith("G") && !address.startsWith("C") && !address.startsWith("M")) {
    hints.push(`must start with "G", "C", or "M" (starts with "${raw[0]}")`);
  }

  if (!address.startsWith("M") && address.length !== 56) {
    hints.push(`must be 56 characters (got ${address.length})`);
  }

  if (address.startsWith("M") && address.length !== 69) {
    hints.push(`muxed address must be 69 characters (got ${address.length})`);
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
        : "not a valid Stellar account, contract, or muxed account ID",
  };
}

/**
 * Decode a valid M-address into its base G account and uint64 muxed ID.
 * Returns null if decoding fails (should not happen after checksum validation).
 */
export function decodeMuxedAddress(
  muxedAddress: string,
): { baseAccount: string; muxedId: string } | null {
  try {
    // Decoded: 8 bytes big-endian uint64 muxed ID + 32 bytes Ed25519 public key
    const decoded = StrKey.decodeMed25519PublicKey(muxedAddress);
    const keyBytes = decoded.slice(8);
    const idBytes = decoded.slice(0, 8);
    const baseAccount = StrKey.encodeEd25519PublicKey(Buffer.from(keyBytes));
    let id = BigInt(0);
    for (const byte of Array.from(idBytes)) {
      id = id * BigInt(256) + BigInt(byte);
    }
    return { baseAccount, muxedId: id.toString() };
  } catch {
    return null;
  }
}
