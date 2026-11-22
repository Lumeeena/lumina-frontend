import type { Metadata } from "next";
import { routeMetadata } from "@/lib/metadata";
import { REGISTRY } from "@/lib/routes";
import { isCategory } from "@/lib/registry";
import RegistryWorkspace from "@/components/RegistryWorkspace";
import RegistryListing from "@/components/RegistryListing";
import RegistryContractInfo from "@/components/RegistryContractInfo";

export const metadata: Metadata = routeMetadata(REGISTRY);

export interface RegistryPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RegistryPage({
  searchParams,
}: RegistryPageProps = {}) {
  const params = searchParams ? await searchParams : {};
  const rawCategory = Array.isArray(params?.category)
    ? params.category[0]
    : params?.category;
  const category = isCategory(rawCategory) ? rawCategory : null;
  const listing = await RegistryListing({ category });

  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12">
      <h1 className="font-extrabold text-3xl mb-2 text-[var(--color-text-primary)]">
        Lumina Registry
      </h1>
      <p className="text-[var(--color-text-secondary)] mb-8 max-w-[70ch]">
        An on-chain Soroban manifest of contracts Lumina indexes. Register your
        contract to opt into priority indexing — permissionless, on
        Stellar/Soroban testnet.
      </p>

      <RegistryContractInfo />

      <RegistryWorkspace listing={listing} />
    </div>
  );
}
