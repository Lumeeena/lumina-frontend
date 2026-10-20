"use client";

import { useState, type FormEvent } from "react";

export interface WebhookFormData {
  url: string;
  events: string[];
}

export interface WebhookFormProps {
  onSubmit: (data: WebhookFormData) => Promise<void>;
  availableEvents: string[];
}

/**
 * Form for registering a new webhook.
 *
 * Collects webhook URL and event subscriptions. Validates URL format
 * and requires at least one event selection.
 */
export function WebhookForm({ onSubmit, availableEvents }: WebhookFormProps) {
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(event)) {
        next.delete(event);
      } else {
        next.add(event);
      }
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate URL
    if (!url.trim()) {
      setError("Webhook URL is required");
      return;
    }

    try {
      new URL(url);
    } catch {
      setError("Invalid URL format");
      return;
    }

    // Validate HTTPS
    if (!url.startsWith("https://")) {
      setError("Webhook URL must use HTTPS");
      return;
    }

    // Validate events
    if (selectedEvents.size === 0) {
      setError("Select at least one event");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        url: url.trim(),
        events: Array.from(selectedEvents),
      });

      // Reset form on success
      setUrl("");
      setSelectedEvents(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register webhook");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* URL Input */}
      <div>
        <label
          htmlFor="webhook-url"
          className="block text-sm font-medium mb-2"
        >
          Webhook URL
        </label>
        <input
          id="webhook-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://api.example.com/webhooks"
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-default)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
          required
        />
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          Must be a valid HTTPS URL that can receive POST requests
        </p>
      </div>

      {/* Event Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Subscribe to events
        </label>
        <div className="space-y-2 max-h-64 overflow-y-auto p-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-subtle)]">
          {availableEvents.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              No events available
            </p>
          ) : (
            availableEvents.map((event) => (
              <label
                key={event}
                className="flex items-center gap-2 cursor-pointer hover:bg-[var(--color-bg-default)] p-2 rounded transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedEvents.has(event)}
                  onChange={() => toggleEvent(event)}
                  className="rounded border-[var(--color-border-default)] text-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-0"
                />
                <span className="text-sm font-mono">{event}</span>
              </label>
            ))
          )}
        </div>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          {selectedEvents.size} event{selectedEvents.size !== 1 ? "s" : ""}{" "}
          selected
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Registering..." : "Register Webhook"}
      </button>
    </form>
  );
}
