'use client';

import { EntityActions } from './EntityActions';

interface ContractActionsProps {
  contract: Record<string, unknown>;
  contractId: string;
}

export function ContractActions({ contract, contractId }: ContractActionsProps) {
  return (
    <EntityActions entity={contract} entityType="contract" address={contractId} />
  );
}
