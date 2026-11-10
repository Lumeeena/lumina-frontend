import { describe, expect, it } from "vitest";
import { validateStellarAddress } from "./stellarAddress";

const VALID_G_ADDRESS = `G${"A".repeat(55)}`;
const VALID_C_ADDRESS = `C${"2".repeat(55)}`;

describe("validateStellarAddress", () => {
  it("accepts valid 56-character G account IDs and C contract IDs", () => {
    expect(validateStellarAddress(VALID_G_ADDRESS)).toEqual({ valid: true });
    expect(validateStellarAddress(VALID_C_ADDRESS)).toEqual({ valid: true });
  });

  it("normalises lowercase input and trims surrounding whitespace", () => {
    expect(validateStellarAddress(VALID_G_ADDRESS.toLowerCase())).toEqual({
      valid: true,
    });
    expect(
      validateStellarAddress(`  ${VALID_C_ADDRESS.toLowerCase()}\n`),
    ).toEqual({
      valid: true,
    });
  });

  it("returns reason 'empty' for an empty string", () => {
    expect(validateStellarAddress("")).toEqual({
      valid: false,
      reason: "empty",
    });
  });

  it("treats whitespace-only input as malformed after trimming", () => {
    const result = validateStellarAddress("   ");
    expect(result).toEqual({
      valid: false,
      reason: "malformed",
      hint: 'must start with "G" or "C" (starts with " "); must be 56 characters (got 0)',
    });
  });

  it("reports a wrong prefix when the address does not start with G or C", () => {
    const secretKeyLike = `S${"A".repeat(55)}`;
    expect(validateStellarAddress(secretKeyLike)).toEqual({
      valid: false,
      reason: "malformed",
      hint: 'must start with "G" or "C" (starts with "S")',
    });
  });

  it("reports a wrong length when the address is shorter or longer than 56 characters", () => {
    const tooShort = `G${"A".repeat(10)}`;
    const tooLong = `C${"A".repeat(60)}`;

    expect(validateStellarAddress(tooShort)).toEqual({
      valid: false,
      reason: "malformed",
      hint: "must be 56 characters (got 11)",
    });
    expect(validateStellarAddress(tooLong)).toEqual({
      valid: false,
      reason: "malformed",
      hint: "must be 56 characters (got 61)",
    });
  });

  it("reports invalid non-Base32 characters such as 0, 1, 8, 9, or punctuation", () => {
    const withBadChars = `G0189!${"A".repeat(50)}`;
    expect(validateStellarAddress(withBadChars)).toEqual({
      valid: false,
      reason: "malformed",
      hint: "contains invalid characters: 0 1 8 9 !",
    });
  });

  it("combines prefix, length, and character hints when multiple rules fail", () => {
    expect(validateStellarAddress("X019")).toEqual({
      valid: false,
      reason: "malformed",
      hint: 'must start with "G" or "C" (starts with "X"); must be 56 characters (got 4); contains invalid characters: 0 1 9',
    });
  });
});
