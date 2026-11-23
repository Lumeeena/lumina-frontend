import { describe, expect, it } from "vitest";
import {
  DEFAULT_DIGEST_PREFERENCE,
  DIGEST_STORAGE_KEY,
  isPlausibleEmail,
  loadDigestPreference,
  normalizeDigestPreference,
  parseDigestPreference,
  saveDigestPreference,
  type DigestStorage,
} from "./digestPreferences";

/** An in-memory Storage. Tracks writes so a test can check what was persisted. */
function memoryStorage(seed: Record<string, string> = {}) {
  const data = new Map(Object.entries(seed));
  const storage: DigestStorage & { data: Map<string, string> } = {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
  return storage;
}

const throwingStorage: DigestStorage = {
  getItem: () => {
    throw new Error("storage blocked");
  },
  setItem: () => {
    throw new Error("storage blocked");
  },
};

describe("isPlausibleEmail", () => {
  it("accepts an ordinary address, ignoring surrounding whitespace", () => {
    expect(isPlausibleEmail("ada@example.com")).toBe(true);
    expect(isPlausibleEmail("  ada@example.com  ")).toBe(true);
  });

  it("rejects text that cannot be a deliverable address", () => {
    expect(isPlausibleEmail("")).toBe(false);
    expect(isPlausibleEmail("ada")).toBe(false);
    expect(isPlausibleEmail("ada@example")).toBe(false);
    expect(isPlausibleEmail("ada @example.com")).toBe(false);
    expect(isPlausibleEmail("a@b@example.com")).toBe(false);
  });

  it("rejects an address longer than the 254-octet path limit", () => {
    const local = "a".repeat(250);
    expect(isPlausibleEmail(`${local}@x.io`)).toBe(false);
  });
});

describe("normalizeDigestPreference", () => {
  it("drops the address when digests are turned off, so none is left behind", () => {
    expect(
      normalizeDigestPreference({ frequency: "off", email: "ada@example.com" }),
    ).toEqual({ ok: true, value: DEFAULT_DIGEST_PREFERENCE });
  });

  it("keeps a trimmed address for a real frequency", () => {
    expect(
      normalizeDigestPreference({
        frequency: "daily",
        email: "  ada@example.com ",
      }),
    ).toEqual({
      ok: true,
      value: { frequency: "daily", email: "ada@example.com" },
    });
  });

  it("refuses a frequency with no usable address rather than storing half of it", () => {
    const result = normalizeDigestPreference({ frequency: "weekly", email: "" });
    expect(result).toEqual({
      ok: false,
      error: "Enter an email address to receive digests.",
    });
  });
});

describe("parseDigestPreference", () => {
  it("returns the stored choice when it is well formed", () => {
    expect(
      parseDigestPreference({ frequency: "weekly", email: "ada@example.com" }),
    ).toEqual({ frequency: "weekly", email: "ada@example.com" });
  });

  it("falls back to off for anything that is not an object", () => {
    expect(parseDigestPreference(null)).toEqual(DEFAULT_DIGEST_PREFERENCE);
    expect(parseDigestPreference("daily")).toEqual(DEFAULT_DIGEST_PREFERENCE);
    expect(parseDigestPreference(42)).toEqual(DEFAULT_DIGEST_PREFERENCE);
  });

  it("falls back to off for a frequency this version does not offer", () => {
    expect(
      parseDigestPreference({ frequency: "hourly", email: "ada@example.com" }),
    ).toEqual(DEFAULT_DIGEST_PREFERENCE);
  });

  it("falls back to off when a frequency is set but its address is missing or invalid", () => {
    expect(parseDigestPreference({ frequency: "daily", email: null })).toEqual(
      DEFAULT_DIGEST_PREFERENCE,
    );
    expect(
      parseDigestPreference({ frequency: "daily", email: "not-an-email" }),
    ).toEqual(DEFAULT_DIGEST_PREFERENCE);
  });

  it("discards an address kept alongside off", () => {
    expect(
      parseDigestPreference({ frequency: "off", email: "ada@example.com" }),
    ).toEqual(DEFAULT_DIGEST_PREFERENCE);
  });
});

describe("loadDigestPreference", () => {
  it("reads back what was saved", () => {
    const storage = memoryStorage();
    const preference = { frequency: "daily" as const, email: "ada@example.com" };

    expect(saveDigestPreference(preference, storage)).toBe(true);
    expect(loadDigestPreference(storage)).toEqual(preference);
  });

  it("is the default when nothing has been stored", () => {
    expect(loadDigestPreference(memoryStorage())).toEqual(DEFAULT_DIGEST_PREFERENCE);
  });

  it("is the default for corrupt JSON instead of throwing", () => {
    const storage = memoryStorage({ [DIGEST_STORAGE_KEY]: "{not json" });
    expect(loadDigestPreference(storage)).toEqual(DEFAULT_DIGEST_PREFERENCE);
  });

  it("is the default when storage throws on read", () => {
    expect(loadDigestPreference(throwingStorage)).toEqual(DEFAULT_DIGEST_PREFERENCE);
  });

  it("is the default when there is no storage at all", () => {
    expect(loadDigestPreference(null)).toEqual(DEFAULT_DIGEST_PREFERENCE);
  });
});

describe("saveDigestPreference", () => {
  it("writes under the documented key", () => {
    const storage = memoryStorage();
    saveDigestPreference({ frequency: "weekly", email: "ada@example.com" }, storage);

    expect(storage.data.has(DIGEST_STORAGE_KEY)).toBe(true);
    expect(JSON.parse(storage.data.get(DIGEST_STORAGE_KEY) ?? "null")).toEqual({
      frequency: "weekly",
      email: "ada@example.com",
    });
  });

  it("reports failure instead of throwing when the write is refused", () => {
    expect(
      saveDigestPreference(DEFAULT_DIGEST_PREFERENCE, throwingStorage),
    ).toBe(false);
  });

  it("reports failure when there is no storage to write to", () => {
    expect(saveDigestPreference(DEFAULT_DIGEST_PREFERENCE, null)).toBe(false);
  });
});
