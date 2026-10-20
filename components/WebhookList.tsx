"use client";

import { useState } from "react";

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
  lastDelivery?: {
    status: "success" | "failed";
    timestamp: string;
    statusCode?: number;
  };
}

export interface WebhookListProps {
  webhooks: Webhook[];
  onDelete: (id: string) => void;
  onTest: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
}

/**
 * Lists registered webhooks with delivery status and management actions.
 *
 * Shows webhook URL, subscribed events, active status, and recent delivery
 * attempts. Provides delete, test, and toggle actions.
 */
export function WebhookList({
  webhooks,
  onDelete,
  onTest,
  onToggle,
}: WebhookListProps) {
  const [testingId, setTestingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      await onTest(id);
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this webhook? This action cannot be undone.")) {
      return;
    }

    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  if (webhooks.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-[var(--color-text-muted)]">
        No webhooks configured. Create your first webhook to receive real-time events.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {webhooks.map((webhook) => (
        <div
          key={webhook.id}
          className="rounded-lg border border-[var(--color-border-default)] p-4 bg-[var(--color-bg-default)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* URL */}
              <div className="flex items-center gap-2 mb-2">
                <code className="text-sm font-mono truncate">
                  {webhook.url}
                </code>
                {webhook.active ? (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    Inactive
                  </span>
                )}
              </div>

              {/* Events */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {webhook.events.map((event) => (
                  <span
                    key={event}
                    className="px-2 py-0.5 text-xs rounded bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)]"
                  >
                    {event}
                  </span>
                ))}
              </div>

              {/* Last delivery */}
              {webhook.lastDelivery && (
                <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-2">
                  {webhook.lastDelivery.status === "success" ? (
                    <span className="text-green-600 dark:text-green-400">
                      ✓ Last delivery succeeded
                    </span>
                  ) : (
                    <span className="text-red-600 dark:text-red-400">
                      ✗ Last delivery failed
                      {webhook.lastDelivery.statusCode && (
                        <span className="ml-1">
                          (HTTP {webhook.lastDelivery.statusCode})
                        </span>
                      )}
                    </span>
                  )}
                  <span>·</span>
                  <span>
                    {new Date(webhook.lastDelivery.timestamp).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggle(webhook.id, !webhook.active)}
                className="px-3 py-1.5 text-sm rounded-lg border border-[var(--color-border-default)] hover:bg-[var(--color-bg-subtle)] transition-colors"
                title={webhook.active ? "Disable webhook" : "Enable webhook"}
              >
                {webhook.active ? "Disable" : "Enable"}
              </button>

              <button
                type="button"
                onClick={() => handleTest(webhook.id)}
                disabled={testingId === webhook.id || !webhook.active}
                className="px-3 py-1.5 text-sm rounded-lg border border-[var(--color-border-default)] hover:bg-[var(--color-bg-subtle)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Send a test event to this webhook"
              >
                {testingId === webhook.id ? "Testing..." : "Test"}
              </button>

              <button
                type="button"
                onClick={() => handleDelete(webhook.id)}
                disabled={deletingId === webhook.id}
                className="px-3 py-1.5 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete this webhook"
              >
                {deletingId === webhook.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
