'use client';

import { EntityActions } from './EntityActions';

interface TransactionActionsProps {
  transaction: Record<string, unknown>;
}

export function TransactionActions({ transaction }: TransactionActionsProps) {
  return (
    <EntityActions entity={transaction} entityType="transaction" />
  );
}
