import { describe, expect, it, vi } from "vitest";
import { AsyncLocalStorage } from "node:async_hooks";
import {
  parseAcceptLanguage,
  matchAcceptLanguage,
  getRequestLocale,
  getServerTranslator,
  LOCALE_COOKIE,
} from "./server";
import { getLocale } from "./index";

interface RequestContext {
  cookies: Map<string, string>;
  headers: Map<string, string>;
}

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

vi.mock("next/headers", () => ({
  cookies: async () => {
    const store = asyncLocalStorage.getStore();
    return {
      get: (name: string) => {
        const val = store?.cookies.get(name);
        return val !== undefined ? { name, value: val } : undefined;
      },
    };
  },
  headers: async () => {
    const store = asyncLocalStorage.getStore();
    return {
      get: (name: string) => {
        return store?.headers.get(name.toLowerCase()) ?? null;
      },
    };
  },
}));

describe("parseAcceptLanguage", () => {
  it("sorts language tags by quality weight descending", () => {
    expect(parseAcceptLanguage("en;q=0.5, de;q=0.9")).toEqual(["de", "en"]);
  });

  it("handles case-insensitive tags and preserves order", () => {
    expect(parseAcceptLanguage("DE-at;q=0.8, EN-us;q=0.4")).toEqual([
      "de-at",
      "en-us",
    ]);
  });

  it("excludes entries with q=0", () => {
    expect(parseAcceptLanguage("de;q=0, en;q=0.8")).toEqual(["en"]);
    expect(parseAcceptLanguage("de;q=0.000, fr;q=0, en")).toEqual(["en"]);
  });

  it("safely handles invalid, malformed, empty, or missing headers", () => {
    expect(parseAcceptLanguage(null)).toEqual([]);
    expect(parseAcceptLanguage(undefined)).toEqual([]);
    expect(parseAcceptLanguage("")).toEqual([]);
    expect(parseAcceptLanguage("   ")).toEqual([]);
    expect(
      parseAcceptLanguage(";;;, invalid;q=xyz, *;q=0.5, 1234;q=0.9"),
    ).toEqual([]);
  });
});

describe("matchAcceptLanguage", () => {
  it("matches exact catalogue keys", () => {
    expect(matchAcceptLanguage("de, en;q=0.5")).toBe("de");
    expect(matchAcceptLanguage("en, de;q=0.5")).toBe("en");
  });

  it("matches subtag prefixes to available catalogues (e.g. de-AT -> de)", () => {
    expect(matchAcceptLanguage("de-AT, de;q=0.9, en;q=0.5")).toBe("de");
    expect(matchAcceptLanguage("de-CH;q=0.9, en-US;q=0.5")).toBe("de");
  });

  it("returns null when no candidate matches available catalogues", () => {
    expect(matchAcceptLanguage("fr-FR, es-ES;q=0.8")).toBeNull();
  });
});

describe("getRequestLocale", () => {
  it("prefers cookie over Accept-Language header", async () => {
    const context: RequestContext = {
      cookies: new Map([[LOCALE_COOKIE, "de"]]),
      headers: new Map([["accept-language", "en-US,en;q=0.9"]]),
    };

    await asyncLocalStorage.run(context, async () => {
      expect(await getRequestLocale()).toBe("de");
    });
  });

  it("falls back to Accept-Language when cookie is absent", async () => {
    const context: RequestContext = {
      cookies: new Map(),
      headers: new Map([["accept-language", "de-DE,de;q=0.9"]]),
    };

    await asyncLocalStorage.run(context, async () => {
      expect(await getRequestLocale()).toBe("de");
    });
  });

  it("defaults to en when neither cookie nor header matches", async () => {
    const context: RequestContext = {
      cookies: new Map(),
      headers: new Map([["accept-language", "fr-FR,es;q=0.8"]]),
    };

    await asyncLocalStorage.run(context, async () => {
      expect(await getRequestLocale()).toBe("en");
    });
  });
});

describe("concurrent Server Component rendering", () => {
  async function SampleServerComponent() {
    const { t, locale, direction } = await getServerTranslator();
    // Simulate an async data fetch delay with variable timing
    await new Promise((resolve) =>
      setTimeout(resolve, Math.floor(Math.random() * 20) + 10),
    );
    return {
      locale,
      direction,
      retryText: t("error.retry"),
      offlineText: t("status.offline"),
    };
  }

  it("renders German for German visitors and English for English visitors concurrently without mutating module state", async () => {
    expect(getLocale()).toBe("en");

    const count = 20;
    const requests = Array.from({ length: count }, (_, i) => {
      const isGerman = i % 2 === 0;
      const context: RequestContext = {
        cookies: new Map(
          isGerman ? [[LOCALE_COOKIE, "de"]] : [[LOCALE_COOKIE, "en"]],
        ),
        headers: new Map([
          [
            "accept-language",
            isGerman ? "de-DE,de;q=0.9,en;q=0.5" : "en-US,en;q=0.9,de;q=0.5",
          ],
        ]),
      };

      return asyncLocalStorage.run(context, async () => {
        const rendered = await SampleServerComponent();
        return { isGerman, rendered };
      });
    });

    const results = await Promise.all(requests);
    expect(results).toHaveLength(20);

    for (const { isGerman, rendered } of results) {
      if (isGerman) {
        expect(rendered.locale).toBe("de");
        expect(rendered.direction).toBe("ltr");
        expect(rendered.retryText).toBe("Erneut versuchen");
        expect(rendered.offlineText).toContain("offline");
      } else {
        expect(rendered.locale).toBe("en");
        expect(rendered.direction).toBe("ltr");
        expect(rendered.retryText).toBe("Retry");
        expect(rendered.offlineText).toContain("offline");
      }
    }

    // Module-level locale must remain English and completely untouched
    expect(getLocale()).toBe("en");
  });
});
