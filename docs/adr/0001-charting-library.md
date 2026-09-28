# ADR 0001 — Charting library

- **Status:** Accepted
- **Date:** 2026-09-27
- **Issue:** #54
- **Deciders:** Lumina frontend maintainers

## Context

Lumina has no charting library. Issue #4 asks for a chart on the
`/stats` page, and #54 asks us to make the library choice deliberately
because it sets the pattern for every future chart.

Constraints:

1. **Bundle budget.** The repo already runs `@next/bundle-analyzer` and
   `scripts/analyze.mjs`; the budget is not decorative. A chart library
   that adds ~90KB+ to the main chunk is not acceptable for a single
   reference chart.
2. **Tailwind v4 with CSS variables.** Lumina's palette lives in
   `app/globals.css` as `var(--color-*)` custom properties, flipped by
   `prefers-color-scheme` and `[data-theme]`. The library must be able to
   read those variables directly — not through a JS theme object that has
   to be kept in sync.
3. **Accessibility.** Charts must be readable by screen readers, keyboard
   navigable where interactive, and must respect the semantic colour
   tokens (success / warning / error / accent).
4. **Next.js 16 / React 19 App Router.** The library must render
   client-side and support SSR-safe hydration for a reference chart.
5. **No dependency on shadcn/ui.** Lumina has its own component patterns
   (see `docs/DESIGN_SYSTEM.md`); we do not want to introduce a second UI
   kit to get charts.

## Candidates considered

| Library | Bundle (tree-shaken, one chart) | Tailwind v4 token fit | A11y | Ecosystem |
|---|---|---|---|---|
| **Recharts** | ~15KB | Excellent — SVG `stroke`/`fill` accept `var()` directly | Good (SVG, `role`, `aria-label` are ours to set) | Largest |
| **Nivo** | ~40–90KB per chart | Fair — theme object must be mapped from CSS vars | Excellent (WCAG AA) | Large |
| **shadcn-charts** | Wraps Recharts | Excellent — native Tailwind | Good (via Recharts) | Growing but requires shadcn/ui |
| **visx** | ~5KB per module | Manual | Manual | Niche |
| **Chart.js** | ~65KB | Poor — canvas, config-object theming | Poor (canvas) | Large |

## Decision

**Adopt Recharts** (`recharts@^2.15.0`).

### Why

1. **Best size-to-capability ratio for our single reference chart.** We
   import only `AreaChart`, `Area`, `XAxis`, `YAxis`, `CartesianGrid`,
   `Tooltip`, `ResponsiveContainer` — no radar, no treemap, no sankey.
2. **CSS-variable theming is native.** Recharts passes the string
   straight to the SVG attribute, so `stroke="var(--color-accent-9)"`
   just works. Dark mode and manual `data-theme` overrides flip for free
   without any JS theme plumbing.
3. **SVG output** — real DOM nodes, inspectable, styleable, and
   accessible via standard `role` / `aria-label` / `<title>` on the
   container we already wrap.
4. **No new UI kit.** Recharts is a pure charting primitive; it does not
   drag in Radix, Emotion, or a second design language.
5. **Sensible default for future contributors.** The most commonly known
   React chart library means a new contributor can read the reference
   implementation and extend it without reading a novel.

### Why not the others

- **Nivo** is 2–6× larger per chart for a11y features we can implement
  ourselves in the wrapper (see `ChartContainer`).
- **shadcn-charts** requires introducing shadcn/ui, which this repo does
  not use. That is a separate, larger ADR.
- **visx** is deliberately low-level; it would push axis, tooltip and
  layout work into every future chart.
- **Chart.js** is canvas-based, which is incompatible with our token
  system and harder to make accessible.

## Consequences

- We add one runtime dependency (`recharts`). Bundle size delta will be
  measured with `npm run analyze` before merge; the target is <20KB gzip
  for the `/stats` route (which is the only consumer of the reference
  chart).
- All future charts must import from `components/charts/`, not directly
  from `recharts`, so that theming, ARIA, and layout stay consistent.
  Direct `recharts` imports outside `components/charts/` will be flagged
  in review.
- The reference chart (`AreaChart`) is documented in
  `docs/DESIGN_SYSTEM.md` as the canonical example.

## Follow-ups (out of scope for #54)

- Bundle-size gate in CI (extend `scripts/analyze.mjs` with a per-route
  budget).
- Bar / line / sparkline variants once a second use case exists.
- Interaction keyboard model (tooltip focus traversal) if a chart
  becomes interactive.

## References

- Issue #54: "Assets: choose and integrate a charting library"
- Issue #4: parent epic for the stats page
- `docs/DESIGN_SYSTEM.md` — palette and component conventions
- `app/globals.css` — token definitions
