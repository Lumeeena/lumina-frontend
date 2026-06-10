import { redirect } from "next/navigation";

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
