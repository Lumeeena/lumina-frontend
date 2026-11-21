import { StrKey } from '@stellar/stellar-sdk';

export type AddressValidation =
  | { valid: true; muxed?: false }
  | { valid: true; muxed: true; baseAccount: string; muxedId: string }
  | { valid: false; reason: "empty" }
  | { valid: false; reason: "malformed"; hint: string };

const STRKEY_REGEX = /^[GC][A-Z2-7]{55}$/;

export function validateStellarAddress(raw: string): AddressValidation {
  if (!raw) return { valid: false, reason: "empty" };
  const address = raw.trim().toUpperCase();

  if (STRKEY_REGEX.test(address)) {
    // Verify the StrKey checksum — the regex only checks alphabet/length
    const isAccount = address.startsWith('G') && StrKey.isValidEd25519PublicKey(address);
    const isContract = address.startsWith('C') && StrKey.isValidContract(address);
    if (isAccount || isContract) return { valid: true };
    return {
      valid: false,
      reason: "malformed",
      hint: "checksum mismatch — the address contains a typo",
    };
  }

  const hints: string[] = [];
  if (!address.startsWith("G") && !address.startsWith("C"))
    hints.push(`must start with "G" or "C" (starts with "${raw[0]}")`);
  if (address.length !== 56)
    hints.push(`must be 56 characters (got ${address.length})`);
  const badChars = Array.from(new Set(address.replace(/[A-Z2-7]/g, "")));
  if (badChars.length > 0)
    hints.push(`contains invalid characters: ${badChars.join(" ")}`);
  return {
    valid: false,
    reason: "malformed",
    hint: hints.length > 0 ? hints.join("; ") : "not a valid Stellar account or contract ID",
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
