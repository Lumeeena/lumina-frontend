'use client';

import { useState } from 'react';
import CodeSnippet from '@/components/CodeSnippet';
import LanguageSelector from '@/components/LanguageSelector';
import { generateJavaScriptClient, generatePythonClient, generateCurlCommand } from '@/lib/codegen';

export default function GettingStartedPage() {
  const [language, setLanguage] = useState('javascript');

  const SIMPLE_QUERY = `
query GetLatestLedger {
  latestLedger {
    sequence
    closedAt
    transactionCount
  }
}
`.trim();

  const PAGINATED_QUERY = `
query GetTransactions {
  transactions(limit: 5) {
    items {
      hash
      ledger
      createdAt
      sourceAccount
      feeCharged
    }
    pageInfo {
      hasNextPage
      cursor
    }
  }
}
`.trim();

  const ACCOUNT_QUERY = `
query GetAccount {
  account(address: "GABC...EXAMPLE") {
    address
    sequence
    balances {
      assetType
      assetCode
      balance
    }
  }
}
`.trim();

  const getCodeSnippet = (query: string, title: string) => {
    switch (language) {
      case 'python':
        return generatePythonClient(query);
      case 'curl':
        return generateCurlCommand(query);
      default:
        return generateJavaScriptClient(query);
    }
  };

  return (
    <div>
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-4">
          Getting Started with Lumina
        </h1>
        <p className="text-lg text-[var(--color-text-secondary)]">
          Learn how to make your first GraphQL query in just a few minutes.
        </p>
      </div>

      {/* Step 1 */}
      <section className="mb-16 scroll-mt-24" id="step-1">
        <div className="flex items-baseline gap-4 mb-6">
          <div className="text-5xl font-bold text-[var(--color-accent-fill)]">1</div>
          <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">
            Make Your First Request
          </h2>
        </div>
        <p className="text-[var(--color-text-secondary)] mb-6 max-w-2xl">
          The Lumina GraphQL API is available at{" "}
          <code className="bg-[var(--color-bg-raised)] px-2 py-1 rounded mono text-sm">
            https://graphql.lumina.app/graphql
          </code>
          . Start with this simple query that fetches the latest ledger:
        </p>

        <div className="mb-6">
          <LanguageSelector selected={language} onChange={setLanguage} />
        </div>

        <CodeSnippet
          code={getCodeSnippet(SIMPLE_QUERY, 'First Request')}
          language={language as any}
          title="First Request"
        />

        <p className="text-sm text-[var(--color-text-muted)] mt-4">
          Copy the code above and run it in your terminal. You should see the latest Stellar ledger information.
        </p>
      </section>

      {/* Step 2 */}
      <section className="mb-16 scroll-mt-24" id="step-2">
        <div className="flex items-baseline gap-4 mb-6">
          <div className="text-5xl font-bold text-[var(--color-accent-fill)]">2</div>
          <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">
            Work with Pagination
          </h2>
        </div>
        <p className="text-[var(--color-text-secondary)] mb-6 max-w-2xl">
          For queries that return multiple items, we use cursor-based pagination.
          The response includes a{" "}
          <code className="bg-[var(--color-bg-raised)] px-2 py-1 rounded mono text-sm">
            pageInfo
          </code>
          {" "}object with{" "}
          <code className="bg-[var(--color-bg-raised)] px-2 py-1 rounded mono text-sm">
            hasNextPage
          </code>
          {" "}and{" "}
          <code className="bg-[var(--color-bg-raised)] px-2 py-1 rounded mono text-sm">
            cursor
          </code>
          {" "}fields:
        </p>

        <CodeSnippet
          code={getCodeSnippet(PAGINATED_QUERY, 'Pagination')}
          language={language as any}
          title="Query with Pagination"
        />

        <div className="mt-6 p-4 bg-[var(--color-bg-subtle)] rounded-lg">
          <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">
            How to fetch the next page:
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] mb-3">
            To get the next page of results, pass the{" "}
            <code className="bg-[var(--color-bg-raised)] px-1 rounded mono text-sm">cursor</code>
            {" "}from the previous response to the next query:
          </p>
          <code className="bg-[var(--color-bg-raised)] px-3 py-2 rounded mono text-sm block text-[var(--color-text-primary)]">
            {`query GetMoreTransactions {
  transactions(limit: 5, cursor: "CURSOR_FROM_PREVIOUS_RESPONSE") { ... }
}`}
          </code>
        </div>
      </section>

      {/* Step 3 */}
      <section className="mb-16 scroll-mt-24" id="step-3">
        <div className="flex items-baseline gap-4 mb-6">
          <div className="text-5xl font-bold text-[var(--color-accent-fill)]">3</div>
          <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">
            Handle Errors Gracefully
          </h2>
        </div>
        <p className="text-[var(--color-text-secondary)] mb-6 max-w-2xl">
          The GraphQL API returns HTTP 200 even when there are errors — check the{" "}
          <code className="bg-[var(--color-bg-raised)] px-2 py-1 rounded mono text-sm">
            errors
          </code>
          {" "}array in the response:
        </p>

        <div className="space-y-4">
          <div className="p-4 bg-[var(--color-bg-subtle)] rounded-lg border border-[var(--color-border-default)]">
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-3">Common Errors:</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-semibold text-[var(--color-text-primary)]">Invalid Query</dt>
                <dd className="text-[var(--color-text-secondary)] text-xs mt-1">
                  Your GraphQL syntax is invalid. Check the{" "}
                  <a
                    href="/graphql"
                    className="text-[var(--color-accent-fill)] hover:underline"
                  >
                    playground
                  </a>
                  {" "}for the correct schema.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--color-text-primary)]">Not Found</dt>
                <dd className="text-[var(--color-text-secondary)] text-xs mt-1">
                  The resource doesn't exist (e.g., an account that hasn't been funded on Stellar).
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[var(--color-text-primary)]">Server Error</dt>
                <dd className="text-[var(--color-text-secondary)] text-xs mt-1">
                  Our backend is temporarily unavailable. Retry with exponential backoff.
                </dd>
              </div>
            </dl>
          </div>

          <CodeSnippet
            code={`// Always check for errors in the response
if (data.errors) {
  console.error("GraphQL Error:", data.errors);
  // Handle the error - retry, log, notify user, etc.
}

// Then access the data
if (data.data) {
  console.log("Success:", data.data);
}`}
            language="javascript"
            title="Error Handling Pattern"
          />
        </div>
      </section>

      {/* Step 4 */}
      <section className="mb-16 scroll-mt-24" id="step-4">
        <div className="flex items-baseline gap-4 mb-6">
          <div className="text-5xl font-bold text-[var(--color-accent-fill)]">4</div>
          <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">
            Explore the Schema
          </h2>
        </div>
        <p className="text-[var(--color-text-secondary)] mb-6 max-w-2xl">
          Visit the{" "}
          <a
            href="/graphql"
            className="text-[var(--color-accent-fill)] hover:underline font-semibold"
          >
            GraphQL Playground
          </a>
          {" "}to explore all available queries and data types. The playground includes
          worked examples you can run live against the API.
        </p>

        <div className="p-6 bg-[var(--color-bg-subtle)] rounded-lg border border-[var(--color-accent-fill)]/20">
          <p className="text-sm text-[var(--color-text-secondary)]">
            <strong>Popular queries:</strong> Recent transactions, Account balances, Contract events,
            Asset information, Payment history
          </p>
        </div>
      </section>

      {/* Next Steps */}
      <section className="mt-16 p-8 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
          What's Next?
        </h2>
        <ul className="space-y-3 text-[var(--color-text-secondary)]">
          <li className="flex gap-3">
            <span className="text-[var(--color-accent-fill)] font-bold">→</span>
            <span>
              <strong>Try the playground:</strong>{" "}
              <a href="/graphql" className="text-[var(--color-accent-fill)] hover:underline">
                Run live queries
              </a>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-[var(--color-accent-fill)] font-bold">→</span>
            <span>
              <strong>Read the docs:</strong>{" "}
              <a href="/developers/interactive-docs" className="text-[var(--color-accent-fill)] hover:underline">
                Dive deeper into pagination and error handling
              </a>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-[var(--color-accent-fill)] font-bold">→</span>
            <span>
              <strong>Generate code:</strong> Use the playground to write a query, then generate
              production-ready code in JavaScript or Python
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-[var(--color-accent-fill)] font-bold">→</span>
            <span>
              <strong>Monitor usage:</strong>{" "}
              <a href="/developers/usage" className="text-[var(--color-accent-fill)] hover:underline">
                Track your API consumption
              </a>
            </span>
          </li>
        </ul>
      </section>
    </div>
  );
}
