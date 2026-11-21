/**
 * Tests for CSV formula-injection sanitization (#363).
 */
import { describe, expect, it } from 'vitest';
import { sanitizeCsvCell, exportToCSV } from './exportUtils';

describe('sanitizeCsvCell – formula injection prevention', () => {
  it('prefixes = with a single quote', () => {
    expect(sanitizeCsvCell('=HYPERLINK("evil.com")')).toBe("'=HYPERLINK(\"evil.com\")");
  });

  it('prefixes + with a single quote', () => {
    expect(sanitizeCsvCell('+1')).toBe("'+1");
  });

  it('prefixes - with a single quote', () => {
    expect(sanitizeCsvCell('-1')).toBe("'-1");
  });

  it('prefixes @ with a single quote', () => {
    expect(sanitizeCsvCell('@SUM(A1:A10)')).toBe("'@SUM(A1:A10)");
  });

  it('prefixes a leading tab with a single quote', () => {
    expect(sanitizeCsvCell('\t=cmd')).toBe("'\t=cmd");
  });

  it('prefixes a leading carriage return with a single quote', () => {
    expect(sanitizeCsvCell('\r=cmd')).toBe("'\r=cmd");
  });

  it('leaves ordinary text unchanged', () => {
    expect(sanitizeCsvCell('hello world')).toBe('hello world');
  });

  it('leaves numbers unchanged', () => {
    expect(sanitizeCsvCell('12345')).toBe('12345');
  });

  it('leaves empty string unchanged', () => {
    expect(sanitizeCsvCell('')).toBe('');
  });

  it('does not double-prefix a value that already starts with a quote', () => {
    // A single quote itself is not in the trigger set
    expect(sanitizeCsvCell("'safe")).toBe("'safe");
  });

  it('prefixes only the first character — does not alter inner =', () => {
    const inner = 'hello=world';
    expect(sanitizeCsvCell(inner)).toBe('hello=world');
  });
});

describe('exportToCSV – integration with sanitization', () => {
  it('sanitizes formula cells in the produced CSV text', () => {
    // Capture blob content via a simple override
    const blobs: string[] = [];
    const origBlob = globalThis.Blob;
    // @ts-expect-error – test only
    globalThis.Blob = class MockBlob {
      constructor(parts: string[]) { blobs.push(parts[0]); }
    };
    const origURL = globalThis.URL;
    // @ts-expect-error – test only
    globalThis.URL = { createObjectURL: () => 'blob:x', revokeObjectURL: () => {} };
    const origDoc = globalThis.document;
    const fakeA = { href: '', download: '', click: () => {} };
    // @ts-expect-error – test only
    globalThis.document = { createElement: () => fakeA };

    exportToCSV(
      [{ memo: '=DANGEROUS()', safe: 'ordinary' }],
      ['memo', 'safe'],
      'test.csv',
    );

    globalThis.Blob = origBlob;
    globalThis.URL = origURL;
    globalThis.document = origDoc;

    expect(blobs[0]).toContain("'=DANGEROUS()");
    expect(blobs[0]).toContain('ordinary');
  });
});
