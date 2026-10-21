/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";
import en from "./en";

// Discover locale files, including newly added catalogues, without importing
// the runtime's English fallback (which would conceal a missing translation).
const catalogues = import.meta.glob<Record<string, string>>(
  ["./*.ts", "!./*.test.ts", "!./index.ts", "!./types.ts", "!./direction.ts"],
  { eager: true, import: "default" },
);

function placeholders(template: string): string[] {
  const found = new Set<string>();
  function scan(text: string) {
    const token = /\{(\w+)(\}|,\s*plural,\s*)/g;
    let match;
    while ((match = token.exec(text))) {
      found.add(`${match[1]}:${match[2] === "}" ? "value" : "plural"}`);
      if (match[2] === "}") continue;
      let pos = token.lastIndex;
      let other = false;
      while (pos < text.length && text[pos] !== "}") {
        const branch = /^\s*(\w+)\s*\{/.exec(text.slice(pos));
        if (!branch) throw new Error(`Invalid plural branch: ${text}`);
        other ||= branch[1] === "other";
        pos += branch[0].length;
        const start = pos;
        let depth = 1;
        while (pos < text.length && depth) {
          if (text[pos] === "{") depth++;
          if (text[pos] === "}") depth--;
          pos++;
        }
        if (depth) throw new Error(`Unclosed plural: ${text}`);
        scan(text.slice(start, pos - 1));
        while (/\s/.test(text[pos] ?? "") && pos < text.length) pos++;
      }
      if (!other || text[pos] !== "}")
        throw new Error(`Missing plural fallback: ${text}`);
      token.lastIndex = pos + 1;
    }
  }
  scan(template);
  return [...found].sort();
}

function errors(
  reference: Record<string, string>,
  catalogue: Record<string, string>,
) {
  const problems: string[] = [];
  for (const [key, message] of Object.entries(reference)) {
    const translated = catalogue[key];
    if (typeof translated !== "string" || !translated.trim()) {
      problems.push(`${key}: missing or empty translation`);
    } else if (
      JSON.stringify(placeholders(message)) !==
      JSON.stringify(placeholders(translated))
    ) {
      problems.push(`${key}: interpolation placeholders differ`);
    }
  }
  for (const key of Object.keys(catalogue)) {
    if (!(key in reference)) problems.push(`${key}: unexpected key`);
  }
  return problems;
}

describe("translation catalogues", () => {
  for (const [locale, catalogue] of Object.entries(catalogues)) {
    it(`${locale} has every English key and matching interpolation arguments`, () => {
      expect(errors({ ...en }, catalogue)).toEqual([]);
    });
  }

  it("detects missing, empty and unexpected keys", () => {
    expect(
      errors({ missing: "Hello", empty: "Hello" }, { empty: " ", extra: "Hi" }),
    ).toEqual([
      "missing: missing or empty translation",
      "empty: missing or empty translation",
      "extra: unexpected key",
    ]);
  });

  it("detects renamed arguments and a missing plural selector", () => {
    expect(
      errors(
        {
          hello: "Hello {name}",
          count: "{count, plural, one {one} other {many}}",
        },
        { hello: "Hallo {user}", count: "many" },
      ),
    ).toHaveLength(2);
  });

  it("compares arguments inside plural branches, without treating branch text as arguments", () => {
    expect(
      placeholders(
        "{count, plural, one {Hello {name}} other {Hello {name} and {extra}}}",
      ),
    ).toEqual(["count:plural", "extra:value", "name:value"]);
    expect(
      errors(
        { count: "{count, plural, one {update} other {updates}}" },
        {
          count:
            "{count, plural, one {Aktualisierung} other {Aktualisierungen}}",
        },
      ),
    ).toEqual([]);
  });

  it("allows argument reordering and repetition", () => {
    expect(
      errors({ hello: "{first} {last}" }, { hello: "{last}, {first} {first}" }),
    ).toEqual([]);
  });

  it("rejects malformed plurals", () => {
    for (const template of [
      "{count, plural, one {hello}}",
      "{count, plural, other {hello}",
      "{count, plural, other broken}",
      "{count, plural, other {{name}",
    ]) {
      expect(() => placeholders(template)).toThrow();
    }
  });
});
