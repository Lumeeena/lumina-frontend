# Adding a language to Lumina

Lumina routes every user-facing string through a message catalogue so the
interface can be translated without touching component code. This guide walks
through adding a new locale end to end.

## Where catalogues live

```
lib/i18n/
  index.ts       runtime: locale switching, lookup, interpolation
  types.ts       MessageCatalogue interface — the shape every locale must match
  en.ts          English (the fallback)
```

Each locale is one TypeScript file that default-exports a `MessageCatalogue`.
TypeScript enforces that every key is present and every value is a string, so a
missing or mistyped key is a build error, not a runtime surprise.

## How to add a locale

### 1. Copy the English catalogue

```bash
cp lib/i18n/en.ts lib/i18n/es.ts   # Spanish, for example
```

### 2. Translate every value

Open `lib/i18n/es.ts` and replace each English string with the translated one.
Leave the keys untouched — they are identifiers, not displayed text.

```ts
import type { MessageCatalogue } from "./types";

const es: MessageCatalogue = {
  "error.retry": "Reintentar",
  "error.backendUnavailableTitle": "Los datos de Lumina no estan disponibles temporalmente",
  // … every other key
};

export default es;
```

TypeScript will error if a key is missing or misspelled, so the build itself
validates completeness.

### 3. Register the locale

In `lib/i18n/index.ts`, import the new catalogue and add it to `CATALOGUES`:

```ts
import en from "./en";
import es from "./es";

const CATALOGUES: Record<string, MessageCatalogue> = { en, es };
```

### 4. Test locally

```bash
npm run dev
```

The active locale defaults to `"en"`. To switch, call `setLocale("es")` — for
example in a browser console, or in a component that reads a language
preference:

```ts
import { setLocale } from "@/lib/i18n";
setLocale("es");
```

Then navigate around the app. Every string that was routed through `t()` will
render in Spanish. Any string still in English either has not been extracted
yet or was intentionally left untranslated (technical identifiers, contract
IDs, hash values).

Run the test suite to make sure nothing broke:

```bash
npm test
```

The i18n unit tests live in `lib/i18n/i18n.test.ts`.

## Catalogue format

### Plain strings

Most entries are plain text:

```ts
"error.retry": "Retry",
```

### Interpolation

Placeholders use `{name}` and are filled at runtime:

```ts
"error.failedToLoadRoute": "Failed to load {route}",
```

The caller passes `t("error.failedToLoadRoute", { route: "Explorer" })` and
the result is `"Failed to load Explorer"`. Placeholder names are stable
identifiers — translate the sentence around them, not the name inside the
braces.

### Pluralisation

A plural block selects between `one` and `other` based on a numeric value:

```ts
"watch.watchedAddresses": "{count} watched {count, plural, one {address} other {addresses}}",
```

`t("watch.watchedAddresses", { count: 1 })` gives `"1 watched address"`;
`count: 5` gives `"5 watched addresses"`.

Languages with more than two plural forms (e.g. Arabic, Polish) are not yet
supported by the runtime. If your language needs them, open an issue and we
will extend the plural resolver.

### What not to translate

- **Keys** (`"error.retry"`, `"explorer.loadMore"`) — these are code
  identifiers, not user text.
- **Technical values** inside `{…}` — the placeholder name is replaced at
  runtime with an untranslated value (a hash, an address, a ledger number).
- **Comments** in the catalogue — they are documentation for translators, not
  displayed text.

## Guidance for translators

- Keep the translated string roughly the same length as the English one. The
  UI is laid out around the English text; a translation that is twice as long
  may overflow or wrap awkwardly.
- Preserve the `{…}` placeholders exactly. Adding, removing or renaming one
  will leave it unresolved in the rendered text.
- Error messages should be reassuring and actionable. "Something went wrong"
  is less helpful than "We could not reach the indexer. Try again in a
  moment."
- Run the app (`npm run dev`) and visit the pages that show your translated
  strings. A translation that reads well in a text file can look wrong in
  context.

## Checklist

- [ ] Every key in `MessageCatalogue` has a translated value.
- [ ] The file compiles (`npx tsc --noEmit`).
- [ ] The locale is registered in `CATALOGUES`.
- [ ] `npm test` passes.
- [ ] You have manually checked the error, empty-state and loading paths in
      the running app.
