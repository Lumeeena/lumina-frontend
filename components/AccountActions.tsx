'use client';

import { EntityActions } from './EntityActions';

interface AccountActionsProps {
  account: Record<string, unknown>;
  address: string;
}

export function AccountActions({ account, address }: AccountActionsProps) {
  return (
    <EntityActions entity={account} entityType="account" address={address} />
  );
}
