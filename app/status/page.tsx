import type { Metadata } from "next";
import { routeMetadata } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return routeMetadata({
    label: "Status & Changelog",
    description: "Current system status and recent changes to Lumina.",
    path: "/status",
  });
}

const changelog = [
  {
    date: "2026-10-21",
    title: "Status and Changelog Page Added",
    description: "Users can now view recent changes and current system status.",
    category: "feature",
  },
  {
    date: "2026-10-21",
    title: "Feature Flags Implemented",
    description: "Infrastructure for safely rolling out incomplete features.",
    category: "feature",
  },
  {
    date: "2026-10-21",
    title: "Privacy-Respecting Analytics",
    description: "Aggregate route and feature usage tracking without personal data.",
    category: "feature",
  },
  {
    date: "2026-10-21",
    title: "Print Stylesheet Added",
    description: "Transaction and account details now print cleanly without UI clutter.",
    category: "improvement",
  },
];

interface HealthStatus {
  service: string;
  status: "operational" | "degraded" | "unavailable";
  message: string;
}

async function getHealth(): Promise<{
  statuses: HealthStatus[];
  lastUpdated: string;
}> {
  try {
    const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql";
    const response = await fetch(graphqlUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "{ __typename }" }),
    });

    const apiStatus: HealthStatus = {
      service: "GraphQL API",
      status: response.ok ? "operational" : "degraded",
      message: response.ok ? "API is responding normally" : "API is responding slowly",
    };

    return {
      statuses: [apiStatus],
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    return {
      statuses: [
        {
          service: "GraphQL API",
          status: "unavailable",
          message: "Unable to connect to API",
        },
      ],
      lastUpdated: new Date().toISOString(),
    };
  }
}

const categoryColors = {
  feature: "bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  improvement: "bg-[var(--color-accent-surface)] text-[var(--color-accent-text)]",
  bugfix: "bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  maintenance: "bg-[var(--color-neutral-bg)] text-[var(--color-neutral-text)]",
};

const statusColors = {
  operational: "bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  degraded: "bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  unavailable: "bg-[var(--color-error-bg)] text-[var(--color-error-text)]",
};

export default async function StatusPage() {
  const { statuses, lastUpdated } = await getHealth();

  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-2">Status & Changelog</h1>
        <p className="text-[var(--color-text-secondary)] mb-8">
          View recent changes and current system status.
        </p>

        <div className="bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">System Status</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </p>

          <div className="space-y-3">
            {statuses.map((status) => (
              <div key={status.service} className="flex items-center justify-between">
                <span className="font-medium">{status.service}</span>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-sm font-semibold ${statusColors[status.status]}`}>
                    {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                  </span>
                  <span className="text-sm text-[var(--color-text-secondary)]">{status.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-6">Recent Changes</h2>
        <div className="space-y-4">
          {changelog.map((entry) => (
            <div
              key={entry.date + entry.title}
              className="bg-[var(--color-bg-subtle)] border border-[var(--color-border-default)] rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h3 className="font-semibold">{entry.title}</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">{entry.description}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                    categoryColors[entry.category as keyof typeof categoryColors] || categoryColors.feature
                  }`}
                >
                  {entry.category}
                </span>
              </div>
              <time className="text-xs text-[var(--color-text-muted)]" dateTime={entry.date}>
                {new Date(entry.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </time>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 p-6 bg-[var(--color-bg-raised)] border border-[var(--color-border-default)] rounded-xl">
        <h3 className="font-semibold mb-2">About This Page</h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
          This page shows the current status of Lumina services and recent user-visible changes. The status is
          refreshed automatically. The changelog is manually maintained by the maintainers.
        </p>
      </div>
    </div>
  );
}
