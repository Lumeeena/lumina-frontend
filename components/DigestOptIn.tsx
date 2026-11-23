"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import {
  DIGEST_FREQUENCIES,
  loadDigestPreference,
  normalizeDigestPreference,
  saveDigestPreference,
  type DigestFrequency,
  type DigestPreference,
  type DigestStorage,
} from "@/lib/digestPreferences";

const FREQUENCY_LABELS: Record<DigestFrequency, string> = {
  off: "Off",
  daily: "Daily",
  weekly: "Weekly",
};

export interface DigestOptInProps {
  /**
   * Where the preference is stored. Production omits it and gets localStorage;
   * tests pass a fake. `null` means no storage is available, which makes saving
   * report a failure rather than pretend it worked.
   */
  storage?: DigestStorage | null;
}

/**
 * The email digest preference (#9). Part of the watch page.
 *
 * The copy is explicit that nothing is sent yet. Email delivery is backend
 * work, so a saved preference is a request the server will honour later, not
 * a digest that is arriving now. Saying otherwise would be a claim the
 * product cannot back up.
 */
export default function DigestOptIn({ storage }: DigestOptInProps) {
  const [saved, setSaved] = useState<DigestPreference>({
    frequency: "off",
    email: null,
  });
  const [frequency, setFrequency] = useState<DigestFrequency>("off");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Loaded after mount rather than during render: the stored value lives in the
  // browser, and the server has no way to know it. Rendering the default first
  // and then the stored choice is the only version that cannot disagree with
  // the server-rendered HTML.
  useEffect(() => {
    const stored = loadDigestPreference(storage);
    setSaved(stored);
    setFrequency(stored.frequency);
    setEmail(stored.email ?? "");
  }, [storage]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = normalizeDigestPreference({ frequency, email });
    if (!result.ok) {
      setNotice(null);
      setError(result.error);
      return;
    }

    setError(null);
    if (saveDigestPreference(result.value, storage)) {
      setSaved(result.value);
      setNotice(
        result.value.frequency === "off"
          ? "Digests are off. No address is kept."
          : `Saved in this browser. No ${result.value.frequency} digest is sent yet, because email delivery needs the backend.`,
      );
    } else {
      setNotice(null);
      setError(
        "This browser would not store the preference, so it was not saved.",
      );
    }
  };

  return (
    <section
      aria-labelledby="digest-heading"
      className="mt-6 rounded-xl border border-[var(--color-border-default)] p-5"
    >
      <h2
        id="digest-heading"
        className="font-extrabold text-base mb-1 text-[var(--color-text-primary)]"
      >
        Email digest
      </h2>
      <p className="mb-4 text-[13px] text-[var(--color-text-secondary)]">
        A periodic summary of activity on your watched addresses, sent to an
        email address. Email delivery is not available yet, so choosing a
        frequency saves your preference without sending anything.
      </p>

      <form noValidate onSubmit={handleSubmit}>
        <fieldset className="mb-4">
          <legend className="mb-2 text-[13px] font-semibold text-[var(--color-text-primary)]">
            How often
          </legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {DIGEST_FREQUENCIES.map((option) => (
              <label
                key={option}
                className="inline-flex items-center gap-2 text-sm text-[var(--color-text-primary)]"
              >
                <input
                  type="radio"
                  name="digest-frequency"
                  value={option}
                  checked={frequency === option}
                  onChange={() => setFrequency(option)}
                />
                {FREQUENCY_LABELS[option]}
              </label>
            ))}
          </div>
        </fieldset>

        {frequency !== "off" && (
          <label className="mb-4 block">
            <span className="mb-1.5 block text-[13px] font-semibold text-[var(--color-text-primary)]">
              Email address
            </span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={error ? true : undefined}
              className="w-full min-h-[44px] px-3 py-2 text-sm bg-[var(--color-bg-raised)] border border-[var(--color-border-default)] rounded-[9px] text-[var(--color-text-primary)]"
            />
          </label>
        )}

        {error && (
          <p role="alert" className="mb-3 text-[13px] text-[var(--color-error-text)]">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="mb-3 text-[13px] text-[var(--color-text-secondary)]">
            {notice}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-[12px] text-[var(--color-text-muted)]">
            {saved.frequency === "off"
              ? "Currently off."
              : `Currently ${saved.frequency} to the address saved in this browser.`}
          </p>
          <Button type="submit" variant="primary" size="sm">
            Save digest settings
          </Button>
        </div>
      </form>
    </section>
  );
}
