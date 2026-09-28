import type { Metadata } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DEVELOPERS } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Developers",
  description: DEVELOPERS.description,
};

const DEVELOPER_PAGES = [
  {
    path: "/developers",
    label: "Overview",
    description: "Getting started with the Lumina API",
  },
  {
    path: "/developers/getting-started",
    label: "Getting Started",
    description: "Step-by-step guide to your first API request",
  },
  {
    path: "/developers/interactive-docs",
    label: "API Documentation",
    description: "Explore the GraphQL schema and worked examples",
  },
  {
    path: "/developers/usage",
    label: "Usage Dashboard",
    description: "Monitor your API key usage and quota",
  },
];

function SidebarNav({ pathname }: { pathname: string }) {
  return (
    <nav className="w-56 bg-[var(--color-bg-subtle)] border-r border-[var(--color-border-default)] flex flex-col">
      <div className="p-6 border-b border-[var(--color-border-default)]">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--color-text-primary)]">
          Developer Portal
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {DEVELOPER_PAGES.map((page) => {
          const isActive = pathname === page.path;
          return (
            <Link
              key={page.path}
              href={page.path}
              className={`block px-6 py-3 text-sm border-l-2 transition-colors ${
                isActive
                  ? "border-[var(--color-accent-fill)] bg-[var(--color-bg-raised)] text-[var(--color-text-primary)] font-semibold"
                  : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              <div className="font-medium">{page.label}</div>
              <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                {page.description}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function DevelopersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Note: usePathname is only available in client components, so this
  // layout splits into a client component for the sidebar nav.
  // For simplicity in this case, we render the sidebar on the server
  // without pathname awareness - the client version would be in a separate component.
  return (
    <div className="flex min-h-[calc(100vh-60px)]">
      <DevelopersSidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-7 py-12">
          {children}
        </div>
      </main>
    </div>
  );
}

function DevelopersSidebar() {
  return (
    <nav className="hidden md:flex md:w-56 bg-[var(--color-bg-subtle)] border-r border-[var(--color-border-default)] flex-col">
      <div className="p-6 border-b border-[var(--color-border-default)]">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--color-text-primary)]">
          Developer Portal
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {DEVELOPER_PAGES.map((page) => (
          <Link
            key={page.path}
            href={page.path}
            className="block px-6 py-3 text-sm border-l-2 border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <div className="font-medium">{page.label}</div>
            <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {page.description}
            </div>
          </Link>
        ))}
      </div>
    </nav>
  );
}
