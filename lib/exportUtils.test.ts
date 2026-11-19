import { describe, expect, it } from 'vitest';

import { buildCSV } from './exportUtils';

const UTF8_BOM = '﻿';

describe('buildCSV', () => {
  it('starts with a UTF-8 BOM', () => {
    const csv = buildCSV([{ a: 'x' }], ['a']);
    expect(csv.startsWith(UTF8_BOM)).toBe(true);
  });

  it('uses CRLF line endings', () => {
    const csv = buildCSV([{ a: '1' }, { a: '2' }], ['a']);
    // Every line break in the content (after the BOM) should be CRLF
    const withoutBom = csv.slice(UTF8_BOM.length);
    expect(withoutBom).toContain('\r\n');
    expect(withoutBom).not.toMatch(/(?<!\r)\n/);
  });

  it('preserves non-ASCII characters', () => {
    const csv = buildCSV([{ memo: 'Ünïcödé' }], ['memo']);
    expect(csv).toContain('Ünïcödé');
  });

  it('wraps values containing commas in quotes', () => {
    const csv = buildCSV([{ a: 'hello, world' }], ['a']);
    expect(csv).toContain('"hello, world"');
  });

  it('escapes embedded double-quotes', () => {
    const csv = buildCSV([{ a: 'say "hi"' }], ['a']);
    expect(csv).toContain('"say ""hi"""');
  });

  it('outputs an empty string for null values', () => {
    const csv = buildCSV([{ a: null }], ['a']);
    const lines = csv.slice(UTF8_BOM.length).split('\r\n');
    expect(lines[1]).toBe('');
  });

  it('respects maxRows', () => {
    const data = Array.from({ length: 10 }, (_, i) => ({ n: i }));
    const csv = buildCSV(data, ['n'], 3);
    const lines = csv.slice(UTF8_BOM.length).split('\r\n');
    // 1 header + 3 data rows
    expect(lines).toHaveLength(4);
  });
});
