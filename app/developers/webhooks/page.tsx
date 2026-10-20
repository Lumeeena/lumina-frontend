"use client";

import { useState } from "react";

interface Webhook {
  id: string;
  url: string;
  events: string[];
  status: "active" | "inactive";
  createdAt: string;
}

interface DeliveryAttempt {
  id: string;
  webhookId: string;
  event: string;
  status: "success" | "failed";
  statusCode?: number;
  timestamp: string;
  error?: string;
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [deliveryAttempts, setDeliveryAttempts] = useState<DeliveryAttempt[]>([]);
  const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null);

  const availableEvents = [
    "transaction.created",
    "transaction.updated",
    "account.created",
    "payment.received",
  ];

  const handleRegisterWebhook = async () => {
    if (!newWebhookUrl || selectedEvents.length === 0) return;

    // TODO: Call backend API
    const newWebhook: Webhook = {
      id: `wh_${Date.now()}`,
      url: newWebhookUrl,
      events: selectedEvents,
      status: "active",
      createdAt: new Date().toISOString(),
    };

    setWebhooks([...webhooks, newWebhook]);
    setNewWebhookUrl("");
    setSelectedEvents([]);
    setShowForm(false);
  };

  const handleDeleteWebhook = async (id: string) => {
    // TODO: Call backend API
    setWebhooks(webhooks.filter((wh) => wh.id !== id));
    if (selectedWebhook === id) {
      setSelectedWebhook(null);
      setDeliveryAttempts([]);
    }
  };

  const handleTestWebhook = async (id: string) => {
    // TODO: Call backend API to test-fire webhook
    const testAttempt: DeliveryAttempt = {
      id: `da_${Date.now()}`,
      webhookId: id,
      event: "test.event",
      status: Math.random() > 0.3 ? "success" : "failed",
      statusCode: Math.random() > 0.3 ? 200 : 500,
      timestamp: new Date().toISOString(),
      error: Math.random() > 0.3 ? undefined : "Connection timeout",
    };

    setDeliveryAttempts([testAttempt, ...deliveryAttempts]);
    setSelectedWebhook(id);
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents(
      selectedEvents.includes(event)
        ? selectedEvents.filter((e) => e !== event)
        : [...selectedEvents, event],
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-4">
          Webhook Management
        </h1>
        <p className="text-lg text-[var(--color-text-secondary)]">
          Register and manage webhooks for real-time event notifications.
        </p>
      </div>

      {/* Register New Webhook */}
      <div className="mb-8">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-[var(--color-accent-fill)] text-white rounded-lg hover:bg-[var(--color-accent-fill)]/90 transition-colors"
          >
            + Register New Webhook
          </button>
        ) : (
          <div className="p-6 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-raised)]">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">
              Register Webhook
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  placeholder="https://your-app.com/webhooks"
                  className="w-full px-4 py-2 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-default)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-fill)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Events
                </label>
                <div className="space-y-2">
                  {availableEvents.map((event) => (
                    <label key={event} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(event)}
                        onChange={() => toggleEvent(event)}
                        className="rounded border-[var(--color-border-default)]"
                      />
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        {event}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleRegisterWebhook}
                  className="px-4 py-2 bg-[var(--color-accent-fill)] text-white rounded-lg hover:bg-[var(--color-accent-fill)]/90 transition-colors"
                >
                  Register
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-[var(--color-bg-subtle)] text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-bg-default)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Webhooks List */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
          Registered Webhooks
        </h2>

        {webhooks.length === 0 ? (
          <div className="p-8 text-center rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-raised)]">
            <p className="text-[var(--color-text-secondary)]">
              No webhooks registered yet. Register your first webhook to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="p-4 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-raised)]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <code className="text-sm font-mono text-[var(--color-text-primary)]">
                        {webhook.url}
                      </code>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          webhook.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {webhook.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {webhook.events.map((event) => (
                        <span
                          key={event}
                          className="px-2 py-1 text-xs bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)] rounded"
                        >
                          {event}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Created {new Date(webhook.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTestWebhook(webhook.id)}
                      className="px-3 py-1 text-sm bg-[var(--color-bg-subtle)] text-[var(--color-text-primary)] rounded hover:bg-[var(--color-bg-default)] transition-colors"
                    >
                      Test
                    </button>
                    <button
                      onClick={() => handleDeleteWebhook(webhook.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delivery Attempts */}
      {deliveryAttempts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
            Recent Delivery Attempts
          </h2>

          <div className="space-y-2">
            {deliveryAttempts.map((attempt) => (
              <div
                key={attempt.id}
                className="p-4 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-raised)]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-[var(--color-text-primary)]">
                        {attempt.event}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          attempt.status === "success"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {attempt.status}
                      </span>
                      {attempt.statusCode && (
                        <span className="text-xs text-[var(--color-text-secondary)]">
                          HTTP {attempt.statusCode}
                        </span>
                      )}
                    </div>
                    {attempt.error && (
                      <p className="text-xs text-red-600 mt-1">{attempt.error}</p>
                    )}
                  </div>
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    {new Date(attempt.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
