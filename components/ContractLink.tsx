import Link from "next/link";
import { truncateAddress } from "@/lib/formatters";

interface ContractLinkProps {
  contractId: string;
  truncate?: number;
  className?: string;
}

export default function ContractLink({
  contractId,
  truncate = 6,
  className = "",
}: ContractLinkProps) {
  if (!contractId) {
    return <span className={className}>—</span>;
  }

  const displayText = truncate ? truncateAddress(contractId, truncate) : contractId;

  return (
    <Link
      href={`/contracts/${contractId}`}
      aria-label={`Contract ${contractId}`}
      className={`text-[var(--color-accent-text)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-fill)] mono ${className}`}
      title={contractId}
    >
      {displayText}
    </Link>
  );
}
