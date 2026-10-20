# Client component audit

The registry page is a server component. It streams public profiles and category
links into a `RegistryWorkspace` client component through its `listing` slot.
Rendering that slot does not pull its implementation into the client import graph.
Profiles, descriptions and reputation badges render on the server; only expanding
slash history needs a client component. The history read imports the RPC code on
demand. Registration and owner management are separate dynamic imports, rendered
only for a connected wallet.

Public profiles are cached on the server for 30 seconds, keyed by registry,
network and RPC endpoint. Reputation amounts are converted to decimal strings
inside the JSON cache and restored to bigint outside it, preserving i128 precision.
Confirmed registration/deactivation calls invalidate this public cache through a
server action and refresh the route. The retry button uses the same action; it
cannot submit a transaction or change on-chain data. Failed reads render an
unavailable state and are never cached as an empty successful listing.

The getting-started guide also renders on the server. Its language provider accepts
server-rendered children; only the language selector, generated examples and copy
buttons need client state. Changing the language still updates both examples.

## Audit decisions

| Routes/components                                             | Boundary                                                  |
| ------------------------------------------------------------- | --------------------------------------------------------- |
| Registry heading, listing, categories, entry cards and badges | Server                                                    |
| Wallet session, tabs, registration and owner actions          | Client; forms loaded on demand                            |
| Slash-history expansion and retry controls                    | Small client components                                   |
| Getting-started guide text and layout                         | Server                                                    |
| Guide language selection and code copying                     | Client components receiving server props                  |
| GraphQL playground                                            | Client: editor, execution and query history               |
| Developer usage dashboard                                     | Client: wallet session, key management and chart controls |
| Other route pages                                             | Already server components composing interactive children  |
| Route error boundaries                                        | Client, as required by Next.js                            |

## Reproducing the JavaScript comparison

Use the same Node version, lockfile and build environment on both revisions:

```bash
npm ci
npm run build:bundle
npm run bundle:report
```

The existing bundle report measures synchronous first-load client chunks plus the
shared runtime, gzipped, and records the contributing chunks. Compare `/registry`
and `/developers/getting-started` in `.next/bundle-report.json`. This measures shipped
JavaScript, not server module size or the size of dynamically loaded wallet code.
It does not claim an improvement in API latency or real-user Core Web Vitals.

Measured with Node 24.15.0, Next 16.2.6 and the same lockfile/environment on both
builds (the existing registry page/card and guide were swapped back for the
comparison; common build repairs were held constant):

| Route                         | Before, gzip bytes | After, gzip bytes |           Reduction |
| ----------------------------- | -----------------: | ----------------: | ------------------: |
| `/registry`                   |            270,493 |           261,566 | 8,927 bytes (3.30%) |
| `/developers/getting-started` |            177,613 |           176,113 | 1,500 bytes (0.84%) |

These are reductions under the repository's client-manifest measurement. They do
not imply that its existing overall bundle budgets pass: several upstream routes
are already oversized or lack budget entries.
