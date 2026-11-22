import CodeSnippet from "@/components/CodeSnippet";
import {
  ExampleLanguageProvider,
  ExampleLanguageSelector,
  QueryExample,
} from "@/components/GettingStartedExamples";
import { t } from "@/lib/i18n";

export default function GettingStartedPage() {
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

  return (
    <ExampleLanguageProvider>
      <div>
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-4">
            {t("guide.heading")}
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)]">
            {t("guide.subtitle")}
          </p>
        </div>

        {/* Step 1 */}
        <section className="mb-16 scroll-mt-24" id="step-1">
          <div className="flex items-baseline gap-4 mb-6">
            <div className="text-5xl font-bold text-[var(--color-accent-fill)]">
              1
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">
              {t("guide.step1.title")}
            </h2>
          </div>
          <p className="text-[var(--color-text-secondary)] mb-6 max-w-2xl">
            {t("guide.step1.before")}{" "}
            <code className="bg-[var(--color-bg-raised)] px-2 py-1 rounded mono text-sm">
              https://graphql.lumina.app/graphql
            </code>
            {t("guide.step1.after")}
          </p>

          <div className="mb-6">
            <ExampleLanguageSelector />
          </div>

          <QueryExample
            query={SIMPLE_QUERY}
            title={t("guide.example.firstRequest")}
          />

          <p className="text-sm text-[var(--color-text-muted)] mt-4">
            {t("guide.step1.hint")}
          </p>
        </section>

        {/* Step 2 */}
        <section className="mb-16 scroll-mt-24" id="step-2">
          <div className="flex items-baseline gap-4 mb-6">
            <div className="text-5xl font-bold text-[var(--color-accent-fill)]">
              2
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">
              {t("guide.step2.title")}
            </h2>
          </div>
          <p className="text-[var(--color-text-secondary)] mb-6 max-w-2xl">
            {t("guide.step2.intro")} {t("guide.step2.response")}
          </p>

          <QueryExample
            query={PAGINATED_QUERY}
            title={t("guide.example.pagination")}
          />

          <div className="mt-6 p-4 bg-[var(--color-bg-subtle)] rounded-lg">
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">
              {t("guide.step2.nextTitle")}
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-3">
              {t("guide.step2.nextBefore")}{" "}
              <code className="bg-[var(--color-bg-raised)] px-1 rounded mono text-sm">
                cursor
              </code>{" "}
              {t("guide.step2.nextAfter")}
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
            <div className="text-5xl font-bold text-[var(--color-accent-fill)]">
              3
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">
              {t("guide.step3.title")}
            </h2>
          </div>
          <p className="text-[var(--color-text-secondary)] mb-6 max-w-2xl">
            {t("guide.step3.before")}{" "}
            <code className="bg-[var(--color-bg-raised)] px-2 py-1 rounded mono text-sm">
              errors
            </code>{" "}
            {t("guide.step3.after")}
          </p>

          <div className="space-y-4">
            <div className="p-4 bg-[var(--color-bg-subtle)] rounded-lg border border-[var(--color-border-default)]">
              <h3 className="font-semibold text-[var(--color-text-primary)] mb-3">
                {t("guide.errors.title")}
              </h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="font-semibold text-[var(--color-text-primary)]">
                    {t("guide.errors.invalidQuery")}
                  </dt>
                  <dd className="text-[var(--color-text-secondary)] text-xs mt-1">
                    {t("guide.errors.invalidQueryBefore")}{" "}
                    <a
                      href="/graphql"
                      className="text-[var(--color-accent-fill)] hover:underline"
                    >
                      {t("guide.errors.invalidQueryLink")}
                    </a>{" "}
                    {t("guide.errors.invalidQueryAfter")}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--color-text-primary)]">
                    {t("guide.errors.notFound")}
                  </dt>
                  <dd className="text-[var(--color-text-secondary)] text-xs mt-1">
                    {t("guide.errors.notFoundDesc")}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--color-text-primary)]">
                    {t("guide.errors.serverError")}
                  </dt>
                  <dd className="text-[var(--color-text-secondary)] text-xs mt-1">
                    {t("guide.errors.serverErrorDesc")}
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
              title={t("guide.errorHandling.title")}
            />
          </div>
        </section>

        {/* Step 4 */}
        <section className="mb-16 scroll-mt-24" id="step-4">
          <div className="flex items-baseline gap-4 mb-6">
            <div className="text-5xl font-bold text-[var(--color-accent-fill)]">
              4
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">
              {t("guide.step4.title")}
            </h2>
          </div>
          <p className="text-[var(--color-text-secondary)] mb-6 max-w-2xl">
            {t("guide.step4.before")}{" "}
            <a
              href="/graphql"
              className="text-[var(--color-accent-fill)] hover:underline font-semibold"
            >
              {t("guide.step4.link")}
            </a>{" "}
            {t("guide.step4.after")}
          </p>

          <div className="p-6 bg-[var(--color-bg-subtle)] rounded-lg border border-[var(--color-accent-fill)]/20">
            <p className="text-sm text-[var(--color-text-secondary)]">
              <strong>{t("guide.step4.popularLabel")}</strong>{" "}
              {t("guide.step4.popularItems")}
            </p>
          </div>
        </section>

        {/* Next Steps */}
        <section className="mt-16 p-8 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
            {t("guide.next.title")}
          </h2>
          <ul className="space-y-3 text-[var(--color-text-secondary)]">
            <li className="flex gap-3">
              <span className="text-[var(--color-accent-fill)] font-bold">
                →
              </span>
              <span>
                <strong>{t("guide.next.tryPlayground.label")}</strong>{" "}
                <a
                  href="/graphql"
                  className="text-[var(--color-accent-fill)] hover:underline"
                >
                  {t("guide.next.tryPlayground.link")}
                </a>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--color-accent-fill)] font-bold">
                →
              </span>
              <span>
                <strong>{t("guide.next.readDocs.label")}</strong>{" "}
                <a
                  href="/developers/interactive-docs"
                  className="text-[var(--color-accent-fill)] hover:underline"
                >
                  {t("guide.next.readDocs.link")}
                </a>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--color-accent-fill)] font-bold">
                →
              </span>
              <span>
                <strong>{t("guide.next.generateCode.label")}</strong>{" "}
                {t("guide.next.generateCode.text")}
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--color-accent-fill)] font-bold">
                →
              </span>
              <span>
                <strong>{t("guide.next.monitorUsage.label")}</strong>{" "}
                <a
                  href="/developers/usage"
                  className="text-[var(--color-accent-fill)] hover:underline"
                >
                  {t("guide.next.monitorUsage.link")}
                </a>
              </span>
            </li>
          </ul>
        </section>
      </div>
    </ExampleLanguageProvider>
  );
}
