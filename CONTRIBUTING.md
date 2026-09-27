# Contributing

Install a supported Node.js LTS version (Node 22 recommended), then run `npm ci`.
Run `npm run codegen` after changing GraphQL operations, `npm test` for unit and
component tests, and `npm run build` before opening a PR. See [TESTING.md](TESTING.md)
for browser tests.

## Staged-file checks

`npm ci` installs the Husky pre-commit hook in a local Git checkout. Before a
commit, `lint-staged` runs ESLint (including fixes, with warnings treated as
failures), then Prettier on staged JavaScript/TypeScript files. Prettier also
formats staged JSON, Markdown, CSS, YAML and GraphQL files. It automatically
stages fixes and preserves unstaged portions of partially staged files. Generated
files and build outputs are ignored by the respective tools. No build, test
suite, or project-wide lint runs in the hook. A one-file local check measured
about 2.7 seconds, including ESLint startup.

Run the same checks manually with `npm run lint:staged`. For an intentional
one-off bypass, use `HUSKY=0 git commit -m "reason"` and explain the reason in your
PR. CI and production-only installs do not install local hooks.

## Bundle report

Run `npm run analyze`. This validates GraphQL operations and makes a production
Webpack build with `@next/bundle-analyzer`, writing interactive treemaps to
`.next/analyze/client.html`, `.next/analyze/nodejs.html` and (when present)
`.next/analyze/edge.html`. Open these files in a browser; the command does not
launch one, so it also works in CI and headless terminals.

Use the client report to inspect the JavaScript sent to browsers. Compare parsed
and gzip sizes, and search for packages such as the Stellar SDK or wallet kit.
Server report totals are not browser download sizes. Reports are ignored build
artifacts and are regenerated each run. Normal builds keep Next.js's default
Turbopack bundler; the analyzer explicitly selects Webpack, so do not treat its
chunk sizes as exact Turbopack production budgets.

This supplies the investigation tool for the separate
[bundle budget issue #34](https://github.com/Lumeeena/lumina-frontend/issues/34).
It does not set a budget or CI threshold.

## GraphQL schema and generated types

`graphql/schema.graphql` is the unmodified backend schema pinned to
[Lumeeena/lumina-backend at 374d3d6](https://github.com/Lumeeena/lumina-backend/blob/374d3d6b96272319c014ca19c35a719f1fea93cb/graphql-server/src/schema.graphql).
The snapshot makes builds reproducible without a running API. When upgrading the
backend, replace it with that deployment's schema and record the new source
revision here. To validate against a local schema or introspection endpoint
instead, run `GRAPHQL_SCHEMA=/path/to/schema.graphql npm run codegen` (a URL also
works). The committed snapshot cannot detect a remote schema change until it is
updated; backend/frontend upgrades must update it together.

Edit `graphql/operations.graphql` for application queries/subscriptions. Playground
examples in `lib/queries.ts` are also validated. Import generated documents directly
from `lib/generated/graphql.ts`, so unused documents can be tree-shaken. `gqlFetch`
and `useSubscription` infer results and variables from those documents; do not
supply handwritten response type arguments. The playground's user-edited text
remains dynamic and is validated by the API when executed.

Run `npm run codegen` and commit `lib/generated/` alongside operation/schema edits.
`npm run build` runs generation first and fails on invalid fields, arguments or
selections. CI also checks generated files for drift after building. Generated
typed strings keep a GraphQL parser out of the browser bundle.

## Virtualizer and React Compiler

See [docs/virtualizer-compiler.md](docs/virtualizer-compiler.md) for the isolated
compiler boundary, reproducible measurement and its limitations.
