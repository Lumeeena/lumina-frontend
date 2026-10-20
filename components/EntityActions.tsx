'use client';

import { useState } from 'react';
import { Download, Copy, Check, QrCode } from 'lucide-react';
import { exportToCSV, getExportLimitNote, copyAsJSON } from '@/lib/exportUtils';
import { AddressQRCode } from './AddressQRCode';

/**
 * EntityActions (#227, #228, #229)
 *
 * Toolbar with copy-as-JSON, CSV export, and QR code toggle for entity
 * detail views (transactions, accounts, contracts).
 */

interface EntityActionsProps {
  entity: Record<string, unknown>;
  entityType: string;
  address?: string;
  columns?: string[];
  data?: Record<string, unknown>[];
}

export function EntityActions({ entity, entityType, address, columns, data }: EntityActionsProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const handleCopyJSON = async () => {
    const ok = await copyAsJSON(entity, entityType);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportCSV = () => {
    if (!data || !columns) return;
    exportToCSV(data, columns, `${entityType}-export.csv`);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleCopyJSON}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        aria-label={`Copy ${entityType} as JSON`}
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? 'Copied!' : 'Copy JSON'}
      </button>

      {data && columns && (
        <button
          type="button"
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          aria-label="Export as CSV"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      )}

      {address && (
        <button
          type="button"
          onClick={() => setShowQR(!showQR)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle QR code"
          aria-expanded={showQR}
        >
          <QrCode className="w-3.5 h-3.5" />
          QR
        </button>
      )}

      {showQR && address && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
          <AddressQRCode address={address} size={160} />
        </div>
      )}
    </div>
  );
}
