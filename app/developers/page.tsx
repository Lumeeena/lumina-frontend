import type { Metadata } from "next";
import Link from "next/link";
import { routeMetadata } from "@/lib/metadata";
import { t } from "@/lib/i18n";

export function generateMetadata(): Metadata {
  return routeMetadata({
    label: "Developer Portal",
    description:
      "Lumina's developer documentation, API guides, and integration resources for building on Stellar.",
    path: "/developers",
  });
}

export default function DevelopersPage() {
  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-7 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-4">
          {t("devPortal.heading")}
        </h1>
        <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl">
          {t("devPortal.description")}
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
                {t("devPortal.gettingStarted.title")}
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                {t("devPortal.gettingStarted.description")}
              </p>
              <div className="mt-4 text-sm font-semibold text-[var(--color-accent-fill)]">
                {t("devPortal.gettingStarted.cta")}
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
                {t("devPortal.apiDocs.title")}
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                {t("devPortal.apiDocs.description")}
              </p>
              <div className="mt-4 text-sm font-semibold text-[var(--color-accent-fill)]">
                {t("devPortal.apiDocs.cta")}
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
                {t("devPortal.playground.title")}
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                {t("devPortal.playground.description")}
              </p>
              <div className="mt-4 text-sm font-semibold text-[var(--color-accent-fill)]">
                {t("devPortal.playground.cta")}
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
                {t("devPortal.usage.title")}
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                {t("devPortal.usage.description")}
              </p>
              <div className="mt-4 text-sm font-semibold text-[var(--color-accent-fill)]">
                {t("devPortal.usage.cta")}
              </div>
            </div>
          </div>
        </Link>

        {/* Webhooks Card */}
        <Link
          href="/developers/webhooks"
          className="group p-6 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-raised)] hover:bg-[var(--color-bg-subtle)] transition-colors"
        >
          <div className="flex items-start gap-4">
            <div className="text-3xl">🔔</div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent-fill)]">
                {t("devPortal.webhooks.title")}
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                {t("devPortal.webhooks.description")}
              </p>
              <div className="mt-4 text-sm font-semibold text-[var(--color-accent-fill)]">
                {t("devPortal.webhooks.cta")}
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Quick Start Section */}
      <div className="mt-12 p-8 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
          {t("devPortal.quickStart.title")}
        </h2>
        <p className="text-[var(--color-text-secondary)] mb-6 max-w-2xl">
          {t("devPortal.quickStart.before")}{" "}
          <Link
            href="/developers/getting-started"
            className="text-[var(--color-accent-fill)] hover:underline font-semibold"
          >
            {t("devPortal.quickStart.link")}
          </Link>{" "}
          {t("devPortal.quickStart.after")}
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <div className="text-2xl font-bold text-[var(--color-accent-fill)] mb-2">
              1
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              <strong>{t("devPortal.step1.action")}</strong>{" "}
              {t("devPortal.step1.rest")}
            </p>
          </div>
          <div>
            <div className="text-2xl font-bold text-[var(--color-accent-fill)] mb-2">
              2
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              <strong>{t("devPortal.step2.action")}</strong>{" "}
              {t("devPortal.step2.rest")}
            </p>
          </div>
          <div>
            <div className="text-2xl font-bold text-[var(--color-accent-fill)] mb-2">
              3
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              <strong>{t("devPortal.step3.action")}</strong>{" "}
              {t("devPortal.step3.rest")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
