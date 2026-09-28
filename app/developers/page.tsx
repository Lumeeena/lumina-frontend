import Link from "next/link";

export default function DevelopersPage() {
  return (
    <div>
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-4">
          Lumina Developer Portal
        </h1>
        <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl">
          Everything you need to integrate Lumina's Stellar API into your application.
          From your first query to production monitoring.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {/* Getting Started Card */}
        <Link
          href="/developers/getting-started"
          className="group p-6 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-raised)] hover:bg-[var(--color-bg-subtle)] transition-colors"
        >
          <div className="flex items-start gap-4">
            <div className="text-3xl">🚀</div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent-fill)]">
                Getting Started
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                Step-by-step guide to making your first API request. Learn about authentication,
                pagination, and error handling with copy-paste code examples.
              </p>
              <div className="mt-4 text-sm font-semibold text-[var(--color-accent-fill)]">
                Get started →
              </div>
            </div>
          </div>
        </Link>

        {/* API Documentation Card */}
        <Link
          href="/developers/interactive-docs"
          className="group p-6 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-raised)] hover:bg-[var(--color-bg-subtle)] transition-colors"
        >
          <div className="flex items-start gap-4">
            <div className="text-3xl">📚</div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent-fill)]">
                API Documentation
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                Explore the GraphQL schema with worked examples you can run live.
                Understand pagination patterns and error handling in depth.
              </p>
              <div className="mt-4 text-sm font-semibold text-[var(--color-accent-fill)]">
                Explore docs →
              </div>
            </div>
          </div>
        </Link>

        {/* Code Generation Card */}
        <Link
          href="/graphql"
          className="group p-6 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-raised)] hover:bg-[var(--color-bg-subtle)] transition-colors"
        >
          <div className="flex items-start gap-4">
            <div className="text-3xl">⚙️</div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent-fill)]">
                Query Playground
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                Write GraphQL queries and generate client code in JavaScript and Python.
                Test your queries live against the real API.
              </p>
              <div className="mt-4 text-sm font-semibold text-[var(--color-accent-fill)]">
                Open playground →
              </div>
            </div>
          </div>
        </Link>

        {/* Usage Dashboard Card */}
        <Link
          href="/developers/usage"
          className="group p-6 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-raised)] hover:bg-[var(--color-bg-subtle)] transition-colors"
        >
          <div className="flex items-start gap-4">
            <div className="text-3xl">📊</div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent-fill)]">
                Usage Dashboard
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                Monitor your API key usage and quota consumption.
                See request counts and trends over time.
              </p>
              <div className="mt-4 text-sm font-semibold text-[var(--color-accent-fill)]">
                View dashboard →
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Start Section */}
      <div className="mt-12 p-8 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
          Quick Start
        </h2>
        <p className="text-[var(--color-text-secondary)] mb-6 max-w-2xl">
          New to Lumina? Head over to our{" "}
          <Link
            href="/developers/getting-started"
            className="text-[var(--color-accent-fill)] hover:underline font-semibold"
          >
            getting started guide
          </Link>
          {" "}to learn the basics. You'll be querying the Stellar blockchain in minutes.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <div className="text-2xl font-bold text-[var(--color-accent-fill)] mb-2">1</div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              <strong>Make a request</strong> using our playground or your preferred language
            </p>
          </div>
          <div>
            <div className="text-2xl font-bold text-[var(--color-accent-fill)] mb-2">2</div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              <strong>Generate code</strong> in JavaScript or Python for your application
            </p>
          </div>
          <div>
            <div className="text-2xl font-bold text-[var(--color-accent-fill)] mb-2">3</div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              <strong>Monitor usage</strong> from your dashboard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
