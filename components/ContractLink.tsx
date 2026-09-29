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
      className={`text-[var(--color-accent-text)] hover:underline mono ${className}`}
      title={contractId}
    >
      {displayText}
    </Link>
  );
}
