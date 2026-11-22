import { describe, expect, it } from 'vitest';

import { validateStellarAddress } from './stellarAddress';

// Real valid addresses
const VALID_ACCOUNT = 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN';
const VALID_CONTRACT = 'CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGAXE';

// Same addresses with one character changed to introduce a checksum error
const BAD_CHECKSUM_ACCOUNT = 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWM';
const BAD_CHECKSUM_CONTRACT = 'CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGAXF';

describe('validateStellarAddress', () => {
  it('accepts a valid Ed25519 account address', () => {
    expect(validateStellarAddress(VALID_ACCOUNT)).toEqual({ valid: true });
  });

  it('accepts a valid contract address', () => {
    expect(validateStellarAddress(VALID_CONTRACT)).toEqual({ valid: true });
  });

  it('rejects empty input', () => {
    const result = validateStellarAddress('');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe('empty');
  });

  it('rejects an account address with a bad checksum', () => {
    const result = validateStellarAddress(BAD_CHECKSUM_ACCOUNT);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe('malformed');
      if (result.reason === 'malformed') expect(result.hint).toContain('checksum');
    }
  });

  it('rejects a contract address with a bad checksum', () => {
    const result = validateStellarAddress(BAD_CHECKSUM_CONTRACT);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe('malformed');
      if (result.reason === 'malformed') expect(result.hint).toContain('checksum');
    }
  });

  it('rejects an address with wrong prefix', () => {
    const result = validateStellarAddress('XAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe('malformed');
      if (result.reason === 'malformed') expect(result.hint).toContain('must start with');
    }
  });

  it('rejects an address that is too short', () => {
    const result = validateStellarAddress('GAAZI4TCR3');
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe('malformed');
      if (result.reason === 'malformed') expect(result.hint).toContain('56 characters');
    }
  });

  it('trims whitespace before validating', () => {
    expect(validateStellarAddress(`  ${VALID_ACCOUNT}  `)).toEqual({ valid: true });
  });

  it('accepts a lower-case address, because input is upper-cased before it is checked', () => {
    expect(validateStellarAddress(VALID_ACCOUNT.toLowerCase())).toEqual({ valid: true });
    expect(validateStellarAddress(VALID_CONTRACT.toLowerCase())).toEqual({ valid: true });
  });

  it('rejects an address that is too long, and says by how much', () => {
    expect(validateStellarAddress(`${VALID_ACCOUNT}A`)).toEqual({
      valid: false,
      reason: 'malformed',
      hint: 'must be 56 characters (got 57)',
    });
  });

  it.each(['0', '1', '8', '9', '!'])(
    'rejects an address containing %s, which is outside the base-32 alphabet',
    (char) => {
      const address = `G${char}${VALID_ACCOUNT.slice(2)}`;
      expect(validateStellarAddress(address)).toEqual({
        valid: false,
        reason: 'malformed',
        hint: `contains invalid characters: ${char}`,
      });
    },
  );

  it('rejects an address with a space inside it', () => {
    const address = `${VALID_ACCOUNT.slice(0, 10)} ${VALID_ACCOUNT.slice(11)}`;
    const result = validateStellarAddress(address);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe('malformed');
      if (result.reason === 'malformed') expect(result.hint).toContain('invalid characters');
    }
  });

  it('rejects input that is only whitespace', () => {
    expect(validateStellarAddress('   ').valid).toBe(false);
  });
});
