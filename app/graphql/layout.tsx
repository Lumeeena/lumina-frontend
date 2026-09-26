import type { Metadata } from "next";

export const metadata: Metadata = { title: "GraphQL Playground | Lumina", description: "Explore and query the Lumina GraphQL API." };

export default function GraphQLLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
