import type { Metadata } from "next";
import Link from "next/link";
import { QUERY_EXAMPLES } from "@/lib/queries";
import { t, type MessageKey } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "API Documentation — Lumina",
  description:
    "Explore the Lumina GraphQL schema with live interactive query examples and pagination guides.",
};

// Display strings for the shared QUERY_EXAMPLES data live in the catalogue;
// `name` stays the English identifier used by the /graphql?example= param.
const EXAMPLE_MESSAGE_KEYS: Record<
  string,
  { name: MessageKey; description: MessageKey }
> = {
  "Recent Transactions": {
    name: "apiDocs.example.recentTransactions.name",
    description: "apiDocs.example.recentTransactions.description",
  },
  "Account Balances": {
    name: "apiDocs.example.accountBalances.name",
    description: "apiDocs.example.accountBalances.description",
  },
  "Payment History": {
    name: "apiDocs.example.paymentHistory.name",
    description: "apiDocs.example.paymentHistory.description",
  },
  "Contract Events": {
    name: "apiDocs.example.contractEvents.name",
    description: "apiDocs.example.contractEvents.description",
  },
};

export default function InteractiveDocsPage() {
  return (
    <div className="w-full max-w-full overflow-hidden sm:overflow-visible">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-4">
          {t("apiDocs.heading")}
        </h1>
        <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl">
          {t("apiDocs.subtitleBefore")}{" "}
          <Link
            href="/graphql"
            className="text-[var(--color-accent-fill)] hover:underline font-semibold"
          >
            {t("apiDocs.subtitleLink")}
          </Link>
          .
        </p>
      </div>

      {/* Pagination Guide */}
      <section className="mb-16 p-8 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
          {t("apiDocs.pagination.title")}
        </h2>
        <div className="space-y-4 text-[var(--color-text-secondary)]">
          <p>{t("apiDocs.pagination.intro")}</p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong>{t("apiDocs.pagination.bulletScalable.label")}</strong>{" "}
              {t("apiDocs.pagination.bulletScalable.desc")}
            </li>
            <li>
              <strong>{t("apiDocs.pagination.bulletStable.label")}</strong>{" "}
              {t("apiDocs.pagination.bulletStable.desc")}
            </li>
            <li>
              <strong>{t("apiDocs.pagination.bulletEfficient.label")}</strong>{" "}
              {t("apiDocs.pagination.bulletEfficient.desc")}
            </li>
          </ul>

          <div className="mt-6 p-4 bg-[var(--color-bg-raised)] rounded border border-[var(--color-border-default)]">
            <p className="font-semibold text-[var(--color-text-primary)] mb-2">
              {t("apiDocs.pagination.returns")}
            </p>
            <code className="mono text-sm text-[var(--color-text-primary)] block">
              {`pageInfo {
  hasNextPage: Boolean  # true if more results exist
  cursor: String        # pass to next query to get next page
}
items: [...]          # the actual results`}
            </code>
          </div>

          <p className="mt-6">{t("apiDocs.pagination.next")}</p>
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
          {t("apiDocs.errors.title")}
        </h2>
        <p className="text-[var(--color-text-secondary)] mb-6">
          {t("apiDocs.errors.before")}{" "}
          <code className="bg-[var(--color-bg-raised)] px-2 py-1 rounded mono text-sm">
            errors
          </code>{" "}
          {t("apiDocs.errors.after")}
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-4 bg-[var(--color-bg-raised)] rounded border border-[var(--color-border-default)]">
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">
              {t("apiDocs.errors.success")}
            </h3>
            <code className="mono text-xs text-[var(--color-text-primary)] block">
              {`{
  "data": {
    "transactions": { ... }
  }
}`}
            </code>
          </div>

          <div className="p-4 bg-[var(--color-bg-raised)] rounded border border-[var(--color-border-default)]">
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">
              {t("apiDocs.errors.error")}
            </h3>
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
          {t("apiDocs.errors.checkBefore")}{" "}
          <code className="bg-[var(--color-bg-raised)] px-2 py-1 rounded mono text-sm">
            errors
          </code>{" "}
          {t("apiDocs.errors.checkMiddle")}{" "}
          <code className="bg-[var(--color-bg-raised)] px-2 py-1 rounded mono text-sm">
            data
          </code>
          {t("apiDocs.errors.checkAfter")}
        </p>
      </section>

      {/* Worked Examples */}
      <section>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-8">
          {t("apiDocs.examples.title")}
        </h2>
        <div className="space-y-8">
          {QUERY_EXAMPLES.map((example, index) => {
            const keys = EXAMPLE_MESSAGE_KEYS[example.name];
            return (
              <div
                key={index}
                className="p-6 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-raised)]"
              >
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                    {keys ? t(keys.name) : example.name}
                  </h3>
                  <p className="text-[var(--color-text-secondary)]">
                    {keys ? t(keys.description) : example.description}
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
                    className="px-4 py-2 rounded bg-[var(--color-accent-fill)] text-white font-semibold hover:opacity-90 transition-opacity text-sm"
                  >
                    {t("apiDocs.tryInPlayground")}
                  </Link>
                  <a
                    href="#pagination-guide"
                    className="px-4 py-2 rounded border border-[var(--color-border-default)] text-[var(--color-text-secondary)] font-semibold hover:text-[var(--color-text-primary)] transition-colors text-sm"
                  >
                    {t("apiDocs.viewDocs")}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Next Steps */}
      <div className="mt-16 p-8 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
          {t("apiDocs.next.title")}
        </h2>
        <ul className="space-y-3 text-[var(--color-text-secondary)]">
          <li className="flex gap-3">
            <span className="text-[var(--color-accent-fill)] font-bold">→</span>
            <span>
              <strong>{t("apiDocs.next.runExample.label")}</strong>{" "}
              {t("apiDocs.next.runExample.text", {
                button: t("apiDocs.tryInPlayground"),
              })}
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-[var(--color-accent-fill)] font-bold">→</span>
            <span>
              <strong>{t("apiDocs.next.modify.label")}</strong>{" "}
              {t("apiDocs.next.modify.text")}
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-[var(--color-accent-fill)] font-bold">→</span>
            <span>
              <strong>{t("apiDocs.next.generate.label")}</strong>{" "}
              {t("apiDocs.next.generate.text")}
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
