# Core Web Vitals budgets

`npm run test:vitals` builds production Next.js, starts a fixed local GraphQL
fixture, and measures every page in Chromium. Static routes come from the route
inventory; detail routes use representative fixed addresses and hashes. A manifest
check fails if a new built page lacks a journey.

The fixture returns populated ledger, transaction, account, asset and event data.
Wallets are disconnected and the registry RPC is deliberately unavailable, so no
external testnet or wallet extension can change the baseline. The registry's
unavailable state and the contract detail fallback are part of this specific
scenario. This does not measure connected-wallet operations or real backend
latency. Keep those limitations in mind when interpreting a change.

Each route gets three fresh browser contexts at 1280×720, UTC, English, without
service workers. After the page and fonts render, a real theme-button click and
keyboard interaction exercise responsiveness. Google's `web-vitals` library records
LCP, CLS and INP. Navigating away flushes final measurements. Missing metrics fail
the run; INP is never substituted with TBT, a JavaScript timer or an assumed zero.

The report uses nearest-rank p75 of the three cold loads. These are repeatable lab
journeys, not field measurements from real users or a mobile/network-throttled
score. The pinned Playwright version pins the Chromium revision used in CI.

The dedicated `build:vitals` command compiles and generates production output in
two phases, matching the repository's compile-mode bundle job. It keeps browser
measurement independent of TypeScript diagnostics. The separate Build & Unit Tests
job remains responsible for the full type check; a passing vitals job does not
imply that the complete CI suite passes.

## Reviewing a regression

`vitals-budget.json` initially contains explicit project targets: LCP 2500 ms,
CLS 0.1 and INP 200 ms per route. Its measured baselines are null because local
browser measurement was not authorized; no samples are invented. On PRs, CI checks
out the base revision, installs its pinned dependencies and measures it with the
same candidate-controlled browser journeys. The candidate run reports signed
deltas against that measured base. If the base cannot build or render, its failure
is preserved as an artifact and its deltas are labelled unavailable; the candidate
still has to pass the committed budgets. A committed measured baseline from a
reviewed update can serve as the fallback reference.

Any over-budget metric, missing budget or missing measurement fails the job.
CI prints each route's measured value, reference, signed delta and budget in the
workflow summary. Overages also produce PR check
annotations. The **core-web-vitals** artifact contains the raw three samples,
aggregates and Markdown table, including a failure explanation if collection
could not complete. No privileged PR-comment workflow is needed for fork PRs.

To accept a deliberate new baseline, run `npm run vitals:update` on an otherwise
idle machine and review the JSON diff. The updater gives LCP 25% plus 200 ms of
headroom (at least 2500 ms), INP 25% plus 50 ms (at least 200 ms), and CLS 0.02
headroom (at least 0.1). These explicit allowances absorb lab noise; they are not
an automatic permission to increase an existing budget. CI refuses to update
budgets. Repeated runs on different hardware can differ, so record the environment
when proposing a baseline change.

Run `npx vitest run scripts/vitals-report.test.mjs` to exercise regression detection,
exact budget boundaries, p75 selection and rejection of missing INP data.
