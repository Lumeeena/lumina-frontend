import Link from 'next/link';
import { QUERY_EXAMPLES } from '@/lib/queries';

export default function InteractiveDocsPage() {
  return (
    <div>
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-4">
          API Documentation
        </h1>
        <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl">
          Explore the GraphQL schema with worked examples you can run live against the API.
          All examples below are runnable in the{" "}
          <Link
            href="/graphql"
            className="text-[var(--color-accent-fill)] hover:underline font-semibold"
          >
            GraphQL Playground
          </Link>
          .
        </p>
      </div>

      {/* Pagination Guide */}
      <section className="mb-16 p-8 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
          Pagination Guide
        </h2>
        <div className="space-y-4 text-[var(--color-text-secondary)]">
          <p>
            All list queries in Lumina use cursor-based pagination. This approach is ideal
            for large datasets because it's:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li><strong>Scalable:</strong> Cursors don't require offset calculations</li>
            <li><strong>Stable:</strong> Results don't shift if items are added/removed</li>
            <li><strong>Efficient:</strong> No need to fetch and skip earlier items</li>
          </ul>

          <div className="mt-6 p-4 bg-[var(--color-bg-raised)] rounded border border-[var(--color-border-default)]">
            <p className="font-semibold text-[var(--color-text-primary)] mb-2">Every list query returns:</p>
            <code className="mono text-sm text-[var(--color-text-primary)] block">
              {`pageInfo {
  hasNextPage: Boolean  # true if more results exist
  cursor: String        # pass to next query to get next page
}
items: [...]          # the actual results`}
            </code>
          </div>

          <p className="mt-6">
            To fetch the next page, pass the cursor from the previous response:
          </p>
          <code className="mono text-sm bg-[var(--color-bg-raised)] px-3 py-2 rounded block text-[var(--color-text-primary)]">
            {`query NextPage {
  transactions(limit: 5, cursor: "cursor_from_previous_response") {
    items { ... }
    pageInfo { hasNextPage cursor }
  }
}`}
          </code>
        </div>
      </section>

      {/* Error Handling */}
      <section className="mb-16 p-8 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
          Error Handling
        </h2>
        <p className="text-[var(--color-text-secondary)] mb-6">
          GraphQL always returns HTTP 200. Check the{" "}
          <code className="bg-[var(--color-bg-raised)] px-2 py-1 rounded mono text-sm">
            errors
          </code>
          {" "}array for problems:
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-4 bg-[var(--color-bg-raised)] rounded border border-[var(--color-border-default)]">
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">Successful Response</h3>
            <code className="mono text-xs text-[var(--color-text-primary)] block">
{`{
  "data": {
    "transactions": { ... }
  }
}`}
            </code>
          </div>

          <div className="p-4 bg-[var(--color-bg-raised)] rounded border border-[var(--color-border-default)]">
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">Error Response</h3>
            <code className="mono text-xs text-[var(--color-text-primary)] block">
{`{
  "errors": [{
    "message": "Invalid query",
    "locations": [...]
  }]
}`}
            </code>
          </div>
        </div>

        <p className="text-[var(--color-text-secondary)] mt-6">
          Always check for{" "}
          <code className="bg-[var(--color-bg-raised)] px-2 py-1 rounded mono text-sm">errors</code>
          {" "}before accessing{" "}
          <code className="bg-[var(--color-bg-raised)] px-2 py-1 rounded mono text-sm">data</code>.
        </p>
      </section>

      {/* Worked Examples */}
      <section>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-8">
          Worked Examples
        </h2>
        <div className="space-y-8">
          {QUERY_EXAMPLES.map((example, index) => (
            <div
              key={index}
              className="p-6 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-raised)]"
            >
              <div className="mb-4">
                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                  {example.name}
                </h3>
                <p className="text-[var(--color-text-secondary)]">
                  {example.description}
                </p>
              </div>

              <div className="bg-[var(--color-bg-subtle)] rounded p-4 mb-4 overflow-x-auto">
                <pre className="mono text-sm text-[var(--color-text-primary)]">
                  <code>{example.query}</code>
                </pre>
              </div>

              <div className="flex gap-3">
                <Link
                  href={`/graphql?example=${encodeURIComponent(example.name)}`}
                  className="px-4 py-2 rounded bg-[var(--color-accent-fill)] text-[var(--color-accent-text)] font-semibold hover:opacity-90 transition-opacity text-sm"
                >
                  Try in Playground
                </Link>
                <a
                  href="#pagination-guide"
                  className="px-4 py-2 rounded border border-[var(--color-border-default)] text-[var(--color-text-secondary)] font-semibold hover:text-[var(--color-text-primary)] transition-colors text-sm"
                >
                  View Docs
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Next Steps */}
      <div className="mt-16 p-8 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
          Next Steps
        </h2>
        <ul className="space-y-3 text-[var(--color-text-secondary)]">
          <li className="flex gap-3">
            <span className="text-[var(--color-accent-fill)] font-bold">→</span>
            <span>
              <strong>Run an example:</strong> Click "Try in Playground" to run any of the
              examples above against the live API
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-[var(--color-accent-fill)] font-bold">→</span>
            <span>
              <strong>Modify and test:</strong> Edit the query in the playground to explore
              different fields and filters
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-[var(--color-accent-fill)] font-bold">→</span>
            <span>
              <strong>Generate code:</strong> Once your query works, generate JavaScript or
              Python code to integrate into your app
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
