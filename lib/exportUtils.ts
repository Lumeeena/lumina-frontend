'use client';

/**
 * Export utilities for filtered views (#228) and Copy-as-JSON (#227).
 */

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

  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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
