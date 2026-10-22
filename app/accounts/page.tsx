import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { routeMetadata } from "@/lib/metadata";

export const metadata: Metadata = routeMetadata({
  path: "/accounts",
  label: "Accounts",
  description:
    "Look up a Stellar account to inspect balances, transactions, operations and trustline history.",
});

export default async function AccountsIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ address?: string }>;
}) {
  const { address } = await searchParams;
  if (address && address.trim()) {
    redirect(`/accounts/${address.trim()}`);
  }
  redirect("/explorer");
}
