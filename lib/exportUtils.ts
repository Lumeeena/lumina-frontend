'use client';

/**
 * Export utilities for filtered views (#228) and Copy-as-JSON (#227).
 */

/**
 * Build a CSV string from data rows.
 *
 * Prepends a UTF-8 BOM so Excel opens the file with the correct encoding
 * (non-ASCII memo text, asset codes, etc., come through ungarbled). Uses
 * RFC 4180 CRLF line endings.
 */
export function buildCSV(
  data: Record<string, unknown>[],
  columns: string[],
  maxRows: number = 1000
): string {
  const BOM = '﻿';
  const limited = data.slice(0, maxRows);
  const headers = columns.join(',');
  const rows = limited.map(row =>
    columns.map(col => {
      const val = row[col];
      if (val === null || val === undefined) return '';
      const str = String(val);
      // Escape CSV: wrap in quotes if contains comma, quote, or newline
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join(',')
  );
  return BOM + [headers, ...rows].join('\r\n');
}

/**
 * Export the current filtered view as CSV.
 * Includes every column, not only the visible ones.
 * Notes the row limit and references bulk export for larger sets.
 */
export function exportToCSV(
  data: Record<string, unknown>[],
  columns: string[],
  filename: string = 'export.csv',
  maxRows: number = 1000
): void {
  const csv = buildCSV(data, columns, maxRows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  // Defer revocation so the browser has time to start the download before the
  // object URL is gone (#364). Immediate revocation can cancel in-flight downloads.
  window.setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Get the row limit note for export UI.
 */
export function getExportLimitNote(totalRows: number, maxRows: number = 1000): string {
  if (totalRows > maxRows) {
    return `Exporting ${maxRows} of ${totalRows} rows. Use bulk export for larger sets.`;
  }
  return `Exporting ${totalRows} rows.`;
}

/**
 * Copy entity data as JSON matching the API response shape (#227).
 * Uses the clipboard component's insecure-context fallback.
 */
export async function copyAsJSON(data: unknown, label: string = 'Entity'): Promise<boolean> {
  const json = JSON.stringify(data, null, 2);
  try {
    await navigator.clipboard.writeText(json);
    return true;
  } catch {
    // Insecure context fallback: use a textarea
    const textarea = document.createElement('textarea');
    textarea.value = json;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}
