# Assigned issue audit: #249, #253, #267

## AccountOperationList accessibility (#267)

| Check | Finding and action |
| --- | --- |
| Names and roles | The table, scroll region, and load control already had semantic names. Transaction links showed shortened hashes; their accessible names now include the full hash, destination, and new-tab behavior. |
| Focus and keyboard | The scroll region now has a token-based visible focus outline. Tests tab through the region and links, then activate Load more with Enter. |
| Contrast | The component uses color tokens throughout. The axe test disables its contrast rule because jsdom cannot resolve CSS variables; `lib/contrast.test.ts` checks token pairs separately. |
| Motion | The link color transition now stops under `prefers-reduced-motion`. No other animation is used in this component. |

The rendered list passes the WCAG A/AA axe scan in `AccountOperationList.test.tsx`. No finding is left open for this component. The automated scan and keyboard tests do not replace a manual assistive technology review.

## Error recovery (#253)

Retry controls now accompany load failures in paginated lists and slash history. Wallet connection, saved-session restoration, network mismatch, and disconnect failures lead to an explicit next action. Transaction submission errors distinguish a declined signature, insufficient balance, invalid input, an unsupported wallet, and a transaction that may already be pending; the pending case tells users to check its status before resubmitting. GraphQL query errors distinguish author-correctable queries from rate limiting and network failures. Clipboard failures offer manual copying. Unknown account and transaction pages tell users what to verify before searching again.

## Registry loading and measured effect (#249)

`RegisterContractForm` and `OwnerContracts` load after a wallet is connected. Public registry cards load when the list approaches the viewport, with a 144 px per-card reservation that remains through the lazy import and a no-IntersectionObserver fallback. The observer starts 400 px ahead of the viewport. The page tests verify that cards are absent until the observer reports visibility and that the placeholder reserves space.

For a comparable production bundle, both versions were compiled with Next.js 16.2.6 webpack in `compile` mode using Node 22. The baseline is upstream `main` (`91b31b3`) with only its two JSX parse errors corrected locally so it can compile. Route-specific initial chunks listed in the client reference manifest were measured on disk:

| Registry route | Baseline | This branch | Change |
| --- | ---: | ---: | ---: |
| Initial JavaScript, raw | 399,274 B | 354,099 B | −45,175 B (−11.3%) |
| Initial JavaScript, gzip | 107,908 B | 95,003 B | −12,905 B (−12.0%) |

In a local Chromium run at 1280 × 800, external RPC requests were blocked so both builds showed the same unavailable-data state. Median of five alternating navigations, measured one second after DOM content loaded: transferred JavaScript was 276,684 B on baseline and 270,830 B on this branch; first contentful paint and largest contentful paint were both 92 ms on each; cumulative layout shift was 0 on each. These lab numbers cover the initial shell and unavailable-data state. Loaded registry cards may have different sizes; the page test verifies their visibility trigger, while the browser number does not cover a populated list. An unblocked browser run also reached the unavailable state on both builds.

The standard build currently stops before compilation because upstream's checked-in GraphQL schema lacks `contractStorageEntries` and `contractStorageKeyHistory`, which `graphql/operations.graphql` queries. That schema mismatch is outside these three issues.
