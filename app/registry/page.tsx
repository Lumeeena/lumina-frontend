import type { Metadata } from "next";
import Link from "next/link";
import { routeMetadata } from "@/lib/metadata";
import { REGISTRY } from "@/lib/routes";
import { isCategory, NETWORK_PASSPHRASE } from "@/lib/registry";
import {
  DEFAULT_NETWORK,
  NETWORKS,
  parseNetwork,
  registryView,
  withNetwork,
  type NetworkId,
} from "@/lib/network";
import RegistryWorkspace from "@/components/RegistryWorkspace";
import RegistryListing from "@/components/RegistryListing";
import RegistryContractInfo from "@/components/RegistryContractInfo";

export const metadata: Metadata = routeMetadata(REGISTRY);

export interface RegistryPageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

function networkName(id: NetworkId): string {
  return NETWORKS.find((network) => network.id === id)?.label ?? id;
}

/**
 * The registry is one contract on one network, so a page asking for another
 * network says so rather than listing this deployment's entries under the
 * wrong name — or, worse, sending a signed registration to the wrong chain.
 */
function UnavailableNotice({
  selected,
  deployedOn,
}: {
  selected: NetworkId;
  deployedOn: NetworkId | null;
}) {
  const selectedName = networkName(selected);
  return (
    <section
      aria-labelledby="registry-unavailable-heading"
      className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)] p-6"
    >
      <h2
        id="registry-unavailable-heading"
        className="font-extrabold text-base mb-2 text-[var(--color-text-primary)]"
      >
        The Registry is not deployed on {selectedName}
      </h2>
      {deployedOn ? (
        <>
          <p className="text-[var(--color-text-secondary)] mb-4 max-w-[70ch]">
            The Registry is a single contract, and this deployment only serves
            it on {networkName(deployedOn)}. There is nothing to list or
            register on {selectedName}.
          </p>
          <Link
            href={withNetwork("/registry", deployedOn)}
            className="font-semibold text-[var(--color-accent-text)] hover:text-[var(--color-accent-text-hover)] hover:underline"
          >
            Open the {networkName(deployedOn)} Registry
          </Link>
        </>
      ) : (
        <p className="text-[var(--color-text-secondary)] max-w-[70ch]">
          This deployment&apos;s network passphrase does not match a network
          Lumina knows, so the Registry has no network to read from.
        </p>
      )}
    </section>
  );
}

export default async function RegistryPage({
  searchParams,
}: RegistryPageProps = {}) {
  const params = searchParams ? await searchParams : {};
  const rawCategory = Array.isArray(params?.category)
    ? params.category[0]
    : params?.category;
  const rawNetwork = Array.isArray(params?.network)
    ? params.network[0]
    : params?.network;
  const view = registryView(rawNetwork, NETWORK_PASSPHRASE);
  const category = isCategory(rawCategory) ? rawCategory : null;

  if (view.kind === "unavailable") {
    return (
      <div className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12">
        <h1 className="font-extrabold text-3xl mb-2 text-[var(--color-text-primary)]">
          Lumina Registry
        </h1>
        <UnavailableNotice
          selected={view.selected}
          deployedOn={view.deployedOn}
        />
      </div>
    );
  }

  const listing = await RegistryListing({ category });
  const served = networkName(view.network);
  // With no network named, the page shows the deployment's own network even
  // though the switcher reads Mainnet. Saying so keeps the two from disagreeing
  // without a reason.
  const implicit = parseNetwork(rawNetwork) === null;

  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12">
      <h1 className="font-extrabold text-3xl mb-2 text-[var(--color-text-primary)]">
        Lumina Registry
      </h1>
      <p className="text-[var(--color-text-secondary)] mb-8 max-w-[70ch]">
        An on-chain Soroban manifest of contracts Lumina indexes. Register your
        contract to opt into priority indexing — permissionless, on
        Stellar/Soroban {served.toLowerCase()}.
      </p>

      {implicit && view.network !== DEFAULT_NETWORK && (
        <p className="mb-6 text-[13px] text-[var(--color-text-muted)] max-w-[70ch]">
          The Registry is deployed on {served} only, so this page shows{" "}
          {served}.
        </p>
      )}

      <RegistryContractInfo />

      <RegistryWorkspace listing={listing} />
    </div>
  );
}
