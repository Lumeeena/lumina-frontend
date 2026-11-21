'use client';

import Link from "next/link";
import { truncateAddress, formatXLM } from "@/lib/formatters";
import { withNetwork } from "@/lib/network";
import { useNetwork } from "@/lib/useNetwork";
import type { Transaction } from "@/lib/types";

interface InnerTransaction {
  hash: string;
  sourceAccount: string;
  operationCount: number;
  successful: boolean;
}

interface FeeBumpTransactionRowProps {
  feePayerTransaction: Transaction;
  innerTransaction?: InnerTransaction | null;
}

export default function FeeBumpTransactionRow({
  feePayerTransaction,
  innerTransaction,
}: FeeBumpTransactionRowProps) {
  const { network } = useNetwork();
  return (
    <div className="rounded-xl border border-[var(--color-border-default)] overflow-hidden bg-[var(--color-bg-subtle)] p-4">
      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-muted)] mb-2">
            Fee Payer
          </h3>
          <Link
            href={withNetwork(`/accounts/${feePayerTransaction.sourceAccount}`, network)}
            className="mono text-xs text-[var(--color-accent-text)] hover:text-[var(--color-accent-text-hover)] hover:underline"
          >
            {feePayerTransaction.sourceAccount}
          </Link>
          <div className="text-xs text-[var(--color-text-secondary)] mt-1">
            Fee:{" "}
            {formatXLM(feePayerTransaction.feeCharged)}{" "}
            XLM
          </div>
        </div>

        {innerTransaction && (
          <div className="pt-4 border-t border-[var(--color-border-default)]">
            <h3 className="text-xs font-semibold uppercase tracking-[0.05em] text-[var(--color-text-muted)] mb-2">
              Inner Transaction
            </h3>
            <div className="space-y-2">
              <Link
                href={withNetwork(`/transactions/${innerTransaction.hash}`, network)}
                className="mono text-xs text-[var(--color-accent-text)] hover:text-[var(--color-accent-text-hover)] hover:underline block truncate"
              >
                {innerTransaction.hash}
              </Link>
              <div className="text-xs text-[var(--color-text-secondary)]">
                Source:{" "}
                <Link
                  href={withNetwork(`/accounts/${innerTransaction.sourceAccount}`, network)}
                  className="text-[var(--color-accent-text)] hover:text-[var(--color-accent-text-hover)] hover:underline"
                >
                  {truncateAddress(innerTransaction.sourceAccount, 10)}
                </Link>
              </div>
              <div className="text-xs text-[var(--color-text-secondary)]">
                Operations: {innerTransaction.operationCount}
              </div>
              <div
                className={`text-xs font-semibold ${
                  innerTransaction.successful
                    ? "text-[var(--color-success-text)]"
                    : "text-[var(--color-error-text)]"
                }`}
              >
                {innerTransaction.successful ? "Successful" : "Failed"}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
