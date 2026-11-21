'use client';

import { EntityActions } from './EntityActions';

interface AssetActionsProps {
  asset: Record<string, unknown>;
}

export function AssetActions({ asset }: AssetActionsProps) {
  return (
    <EntityActions entity={asset} entityType="asset" />
  );
}
