import { Suspense } from 'react';
import { isCategory } from '@/lib/registry';
import RegistryWorkspace from '@/components/RegistryWorkspace';
import RegistryListing from '@/components/RegistryListing';

export default async function RegistryPage({ searchParams = Promise.resolve({}) }: {
  searchParams?: Promise<{ category?: string | string[] }>;
} = {}) {
  const { category: value } = await searchParams;
  const category = typeof value === 'string' && isCategory(value) ? value : null;
  return <div className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12">
    <h1 className="font-extrabold text-3xl mb-2 text-[var(--color-text-primary)]">Lumina Registry</h1>
    <p className="text-[var(--color-text-secondary)] mb-8 max-w-[70ch]">
      An on-chain Soroban manifest of contracts Lumina indexes. Register your contract to opt into priority indexing — permissionless, on Stellar/Soroban testnet.
    </p>
    <RegistryWorkspace listing={<Suspense fallback={<p className="text-sm text-[var(--color-text-muted)]">Loading registry entries…</p>}><RegistryListing category={category} /></Suspense>} />
  </div>;
}
