// Helper functions for working with fee bump transactions

export interface FeeBumpTransaction {
  feePayerAccount: string;
  feeCharged: string;
  innerTransaction?: {
    hash: string;
    sourceAccount: string;
    operations: number;
    successful: boolean;
  } | null;
}

export function isFeeBumpTransaction(
  sourceAccount: string,
  actualFeePayer?: string
): boolean {
  // Fee bump is indicated when the source account differs from the fee payer
  return !!(actualFeePayer && sourceAccount !== actualFeePayer);
}

export function formatFeeBump(feeBump: FeeBumpTransaction): {
  feePayerAddress: string;
  feeAmount: string;
  hasInnerTransaction: boolean;
} {
  return {
    feePayerAddress: feeBump.feePayerAccount,
    feeAmount: (parseInt(feeBump.feeCharged) / 1e7).toFixed(7),
    hasInnerTransaction: !!(feeBump.innerTransaction),
  };
}

export function getFeeBumpDescription(feeBump: FeeBumpTransaction): string {
  const fee = (parseInt(feeBump.feeCharged) / 1e7).toFixed(7);
  if (feeBump.innerTransaction) {
    return `Fee bump: ${fee} XLM paid by ${feeBump.feePayerAccount}`;
  }
  return `Fee: ${fee} XLM`;
}
