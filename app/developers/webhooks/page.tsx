"use client";

import { useState } from "react";
import { WebhookList, type Webhook } from "@/components/WebhookList";
import { WebhookForm, type WebhookFormData } from "@/components/WebhookForm";

/**
 * Webhook management page for the developer dashboard.
 *
 * Allows developers to register, list, test, and delete webhooks.
 * Shows recent delivery attempts and failures.
 *
 * Note: This is a UI-only implementation. Backend webhook endpoints
 * need to be implemented separately (issue #214 dependency).
 */
export default function WebhooksPage() {
  // Mock data for demonstration
  const [webhooks, setWebhooks] = useState<Webhook[]>([
    {
      id: "wh_1",
      url: "https://api.example.com/webhooks/stellar",
      events: ["transaction.created", "transaction.verified", "payment.received"],
      active: true,
      createdAt: new Date().toISOString(),
      lastDelivery: {
        status: "success",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        statusCode: 200,
      },
    },
  ]);

  const [showForm, setShowForm] = useState(false);

  // Available webhook events (will come from API)
  const availableEvents = [
    "transaction.created",
    "transaction.verified",
    "transaction.failed",
    "payment.received",
    "payment.sent",
    "account.updated",
    "operation.created",
  ];

  // Handler: Register new webhook
  const handleRegister = async (data: WebhookFormData) => {
    // TODO: Replace with actual API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newWebhook: Webhook = {
      id: `wh_${Date.now()}`,
      url: data.url,
      events: data.events,
      active: true,
      createdAt: new Date().toISOString(),
    };

    setWebhooks((prev) => [...prev, newWebhook]);
    setShowForm(false);
  };

  // Handler: Delete webhook
  const handleDelete = async (id: string) => {
    // TODO: Replace with actual API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
  };

  // Handler: Test webhook
  const handleTest = async (id: string) => {
    // TODO: Replace with actual API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log(`Test event sent to webhook ${id}`);
  };

  // Handler: Toggle webhook active status
  const handleToggle = async (id: string, active: boolean) => {
    // TODO: Replace with actual API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    setWebhooks((prev) =>
      prev.map((w) => (w.id === id ? { ...w, active } : w))
    );
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Webhooks</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Receive real-time notifications when events occur in your integration
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity"
        >
          {showForm ? "Cancel" : "New Webhook"}
        </button>
      </div>

      {/* Registration Form */}
      {showForm && (
        <div className="rounded-lg border border-[var(--color-border-default)] p-6 bg-[var(--color-bg-subtle)]">
          <h2 className="text-lg font-semibold mb-4">Register New Webhook</h2>
          <WebhookForm
            onSubmit={handleRegister}
            availableEvents={availableEvents}
          />
        </div>
      )}

      {/* Webhook List */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Registered Webhooks ({webhooks.length})
        </h2>
        <WebhookList
          webhooks={webhooks}
          onDelete={handleDelete}
          onTest={handleTest}
          onToggle={handleToggle}
        />
      </div>

      {/* Documentation Link */}
      <div className="rounded-lg border border-[var(--color-border-default)] p-4 bg-[var(--color-bg-subtle)]">
        <h3 className="text-sm font-semibold mb-2">Need help?</h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          Learn how to verify webhook signatures, handle retries, and debug
          delivery failures in the{" "}
          <a
            href="/developers/interactive-docs"
            className="text-[var(--color-primary)] hover:underline"
          >
            webhook documentation
          </a>
          .
        </p>
      </div>
    </div>
  );
}
