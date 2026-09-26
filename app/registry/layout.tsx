import type { Metadata } from "next";

export const metadata: Metadata = { title: "Registry | Lumina", description: "Browse and register contracts indexed by Lumina." };

export default function RegistryLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
