# Networks

Lumina can be pointed at more than one Stellar network, and the one a page is
about is part of its URL.

## The shape: a query parameter

```
/explorer                        mainnet — the default, and the only network
                                 that is ever implicit
/explorer?network=testnet        testnet
/transactions/1a2b…?network=futurenet
```

**A query parameter, not a path segment.** Both were on the table; the reasons
for this one:

- **Routes are paths, networks are filters.** Every route in the app already has
  a canonical path, and `lib/routes.ts` feeds it to the nav, the sitemap, the
  metadata builders and `robots.ts`. `/testnet/explorer` would move all eight of
  them under a prefix and change every canonical URL and every `og:url` in order
  to say something that is not a location — it is the same page, scoped to a
  different chain. The page is `/explorer` on every network.
- **`robots.ts` already has the right rule.** Crawl exclusions treat `/*?` as
  "the same content as the canonical route, do not multiply the URL space",
  which is exactly how a network parameter should be treated. A path segment
  would need a new rule for a set of URLs that are not new content.
- **It survives being shared.** A query string is preserved by chat clients,
  redirects and link shorteners far more reliably than a path prefix that any
  middleware may or may not rewrite.

## The rule: written only when it says something

`mainnet` is the default, and **a link on the default network carries no
parameter at all**:

| URL | Means |
| --- | --- |
| `/explorer` | mainnet |
| `/explorer?network=mainnet` | mainnet — not canonical, and corrected on load |
| `/explorer?network=testnet` | testnet |
| `/explorer?network=TESTNET` | testnet — not canonical, and corrected on load |
| `/explorer?network=lolnet` | mainnet — unknown names fall back, and the URL is corrected |

Two consequences worth stating outright:

- Every URL that exists today keeps its exact spelling, because the default
  network writes nothing. Canonical links, `og:url`, the sitemap and the crawl
  rules are untouched.
- `?network=mainnet` is not a second spelling of `/explorer`. The app rewrites
  it to the canonical form rather than serving the same page at two addresses.

The same rewrite makes a hand-typed `?network=TESTNET` canonical, and takes a
value nobody recognises (`?network=lolnet`) back out of the address bar instead
of leaving a claim in the URL that no page honours. Other query parameters are
left exactly where they were, in order.

## Where this lives

| File | What it is |
| --- | --- |
| `lib/network.ts` | The catalogue — `mainnet`, `testnet`, `futurenet` with their passphrases — and the pure URL helpers: `parseNetwork`, `readNetwork`, `withNetwork`, `isInternalHref`. Dependency-free, so the nav, the switcher and the tests can all read it. |
| `lib/useNetwork.ts` | `useNetwork()`: the selected network, read from the URL, and `setNetwork` to change it. `router.replace`, not `push` — the network is a property of the page, not a step in a history. |
| `components/NetworkSwitcher.tsx` | The control in the nav. Its selection *is* the URL; it holds no state of its own. |
| `components/Navbar.tsx` | Every link carries the network it was rendered on, so the selection survives navigation instead of reverting on the first click. |

`useSearchParams` suspends while the URL is being read, so the nav renders its
links behind a `<Suspense>` boundary whose fallback is the same nav on the
default network: the server-rendered HTML is a complete nav, not an empty one
that fills in after hydration.

## Not yet

The URL says which network a page is about; making every page *serve* that
network is the rest of [#10](https://github.com/Lumeeena/lumina-frontend/issues/10):

- GraphQL queries are not parametrized by network, because the backend schema
  does not accept one yet (the backend issue is a hard dependency there).
- The Registry page's RPC URL, passphrase and contract id still come from
  `NEXT_PUBLIC_*` environment variables, one deployment per network — see
  [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md). Between a URL that
  selects testnet and a build configured for mainnet, the build wins until that
  work lands.
- Internal links outside the nav — search results, transaction tables, account
  activity — are not yet written with `withNetwork`.
