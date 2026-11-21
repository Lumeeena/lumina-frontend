import Link from "next/link";
import { truncateAddress } from "@/lib/formatters";
import type { SharedWasmContract } from "@/lib/contractInterface";

export interface SharedWasmContractsProps {
  /** Other contracts deployed from this contract's wasm, never this one. */
  contracts: SharedWasmContract[];
  /** How many were asked for; a full page may not be all of them. */
  limit: number;
}

const th =
  "text-left text-[11px] tracking-[0.06em] uppercase text-[var(--color-text-muted)] px-3 py-2.5 border-b border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]";
const link =
  "mono text-xs text-[var(--color-accent-text)] hover:text-[var(--color-accent-text-hover)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-fill)]";

/**
 * The "same code as" list in a contract's deployment section.
 *
 * Identical code is a signal either way: a token deployed from a known,
 * audited wasm, or a scam cloned from one. Each row says who deployed the copy
 * and when, which is what tells the two apart.
 */
export default function SharedWasmContracts({
  contracts,
  limit,
}: SharedWasmContractsProps) {
  return (
    <div className="mt-5">
      <h3
        id="shared-wasm-heading"
        className="text-sm font-semibold text-[var(--color-text-primary)] mb-1"
      >
        Contracts with the same code
      </h3>

      {contracts.length === 0 ? (
        <p className="text-xs text-[var(--color-text-muted)]">
          No other indexed contract was deployed from this wasm.
        </p>
      ) : (
        <>
          <p className="text-xs text-[var(--color-text-muted)] mb-3">
            Deployed from the same wasm as this contract. Identical code can be
            a known, audited contract reused, or a copy of one, so check who
            deployed each.
          </p>
          <div
            role="region"
            aria-labelledby="shared-wasm-heading"
            tabIndex={0}
            className="rounded-xl border border-[var(--color-border-default)] overflow-x-auto"
          >
            <table className="w-full text-sm border-collapse">
              <caption className="sr-only">
                Contracts deployed from the same wasm
              </caption>
              <thead>
                <tr>
                  <th scope="col" className={th}>
                    Contract
                  </th>
                  <th scope="col" className={th}>
                    Deployer
                  </th>
                  <th scope="col" className={th}>
                    Deployment ledger
                  </th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => (
                  <tr
                    key={contract.contractId}
                    className="border-b border-[var(--color-bg-overlay)] last:border-0"
                  >
                    <td className="py-2.5 px-3">
                      <Link
                        href={`/contracts/${contract.contractId}`}
                        className={link}
                      >
                        {truncateAddress(contract.contractId, 8)}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3">
                      <Link
                        href={`/accounts/${contract.deployer}`}
                        className={link}
                      >
                        {truncateAddress(contract.deployer, 6)}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3">
                      <Link
                        href={`/ledgers/${contract.deployedLedger}`}
                        className={link}
                      >
                        {contract.deployedLedger.toLocaleString("en-US")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {contracts.length >= limit && (
            <p className="text-xs text-[var(--color-text-muted)] mt-2">
              Showing the first {limit} contracts with this code.
            </p>
          )}
        </>
      )}
    </div>
  );
}
