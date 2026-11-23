/**
 * The email digest preference: how often someone wants a summary of their
 * watched activity, and the address to send it to. Part of #9.
 *
 * This module stores the preference and nothing else. Sending a digest is
 * backend work — there is no sender yet — so a saved preference changes no
 * email. The UI says so, because a preference that looks active and is not is
 * worse than no preference at all.
 *
 * The address lives in this browser's localStorage, the same place the watch
 * list lives. It is not sent anywhere from here.
 */

export const DIGEST_STORAGE_KEY = "lumina.digestPreference";

export const DIGEST_FREQUENCIES = ["off", "daily", "weekly"] as const;

export type DigestFrequency = (typeof DIGEST_FREQUENCIES)[number];

export interface DigestPreference {
  frequency: DigestFrequency;
  /** Null exactly when `frequency` is `off`. */
  email: string | null;
}

export const DEFAULT_DIGEST_PREFERENCE: DigestPreference = {
  frequency: "off",
  email: null,
};

/** The slice of Storage this module uses, injectable for tests. */
export interface DigestStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** RFC 5321 caps a forward path at 254 octets; anything longer cannot be delivered. */
const MAX_EMAIL_LENGTH = 254;

// Deliberately loose: the only check that matters is that a digest has a
// plausible address to go to. Full RFC validation rejects real addresses, and
// the mail server is the only thing that can confirm one exists.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isPlausibleEmail(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length <= MAX_EMAIL_LENGTH && EMAIL_SHAPE.test(trimmed);
}

export type DigestResult =
  | { ok: true; value: DigestPreference }
  | { ok: false; error: string };

/**
 * Turn a form's raw input into a preference that is safe to store.
 *
 * `off` discards any address, so turning digests off does not leave a
 * forgotten email behind. Any other frequency needs an address that looks
 * deliverable; without one the preference is refused, not saved half-formed.
 */
export function normalizeDigestPreference(input: {
  frequency: DigestFrequency;
  email: string;
}): DigestResult {
  if (input.frequency === "off") {
    return { ok: true, value: DEFAULT_DIGEST_PREFERENCE };
  }

  const email = input.email.trim();
  if (!isPlausibleEmail(email)) {
    return {
      ok: false,
      error: "Enter an email address to receive digests.",
    };
  }

  return { ok: true, value: { frequency: input.frequency, email } };
}

/**
 * Read a stored value defensively. Anything unexpected — a hand-edited key, a
 * value from an older version, a frequency we no longer offer — is the default,
 * because a digest set to something nobody chose is worse than no digest.
 */
export function parseDigestPreference(raw: unknown): DigestPreference {
  if (typeof raw !== "object" || raw === null) return DEFAULT_DIGEST_PREFERENCE;

  const { frequency, email } = raw as Record<string, unknown>;
  if (frequency === "off") return DEFAULT_DIGEST_PREFERENCE;

  const known = DIGEST_FREQUENCIES.includes(frequency as DigestFrequency);
  if (!known || typeof email !== "string" || !isPlausibleEmail(email)) {
    return DEFAULT_DIGEST_PREFERENCE;
  }

  return { frequency: frequency as DigestFrequency, email: email.trim() };
}

function defaultStorage(): DigestStorage | null {
  // Reading `localStorage` itself can throw in sandboxed frames and with
  // storage blocked, so the lookup is inside the try as well.
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

export function loadDigestPreference(
  storage: DigestStorage | null = defaultStorage(),
): DigestPreference {
  if (!storage) return DEFAULT_DIGEST_PREFERENCE;
  try {
    const stored = storage.getItem(DIGEST_STORAGE_KEY);
    return stored === null
      ? DEFAULT_DIGEST_PREFERENCE
      : parseDigestPreference(JSON.parse(stored));
  } catch {
    return DEFAULT_DIGEST_PREFERENCE;
  }
}

/** Returns whether the write landed, so the UI can say when it did not. */
export function saveDigestPreference(
  preference: DigestPreference,
  storage: DigestStorage | null = defaultStorage(),
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(DIGEST_STORAGE_KEY, JSON.stringify(preference));
    return true;
  } catch {
    return false;
  }
}
