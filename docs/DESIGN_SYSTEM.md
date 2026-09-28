# Lumina Design System

A practical reference for contributors. Every token, spacing rule and component
lives here so a new page is consistent by default rather than by copying the
nearest file.

---

## Tokens

All colours are CSS custom properties defined in `app/globals.css`. That file
is the only place a hex value may be written: components reference
`var(--token-name)` — never a hard-coded hex — so changing a token updates
every use, and the `custom/no-raw-hex-colors` ESLint rule fails `npm run lint`
on a hex in `app/` or `components/`.

Tokens are named for the role they play, never for the colour they happen to
be: `--color-accent-fill`, not `--color-violet-500`.

Two consumers cannot read CSS custom properties — the generated web-app
manifest and the Satori share cards. `npm run codegen` mirrors the light
palette into `lib/generated/palette.ts`; `lib/palette.test.ts` fails if that
mirror and `app/globals.css` ever disagree.

### Backgrounds

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-bg-base` | `#ffffff` | `#0e0e12` | Page background, form inputs, cards |
| `--color-bg-subtle` | `#fafafa` | `#18181f` | Card / panel fill |
| `--color-bg-raised` | `#f6f5f8` | `#1e1d27` | Button fill, chips, hover states, nav highlight |
| `--color-bg-overlay` | `#f0eff3` | `#262534` | Inner dividers, wells, row separators |
| `--color-skeleton-bg` | `#eeeef2` | `#1e1d27` | Loading placeholder bars |
| `--color-inverse-bg` | `#0e0e12` | `#262534` | Offline banner — always pairs with white text |

### Text

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-text-primary` | `#0e0e12` | `#f2f0fa` | Body copy, headings |
| `--color-text-secondary` | `#6b6975` | `#9b98a8` | Labels, captions, secondary info |
| `--color-text-muted` | `#a6a3b0` | `#6b6975` | Placeholders, timestamps, "end of results" |
| `--color-text-faint` | `#c3c1cb` | `#57545f` | Lowest-emphasis hints: row timestamps, idle dots |
| `--color-text-inverse` | `#ffffff` | `#ffffff` | White content on a brand or inverse surface |

### Borders

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-border-default` | `#e5e3ea` | `#2e2c3d` | Cards, inputs, dividers |
| `--color-border-strong` | `#c4b5fd` | `#7c3aed` | Accent hover border on chips/inputs |

### Accent (Brand Violet)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-accent-fill` | `#8b5cf6` | `#8b5cf6` | Primary button fill, focus ring, brand mark |
| `--color-accent-fill-hover` | `#7c3aed` | `#a78bfa` | Primary button hover |
| `--color-accent-surface` | `#f5f3ff` | `#1e1a2e` | Selected chip / tab / badge background |
| `--color-accent-text` | `#7c3aed` | `#c4b5fd` | Accent text (links, selected labels) |
| `--color-accent-text-hover` | `#6d28d9` | `#a78bfa` | Hover state for accent text |
| `--color-accent-gradient` | *same* | *same* | Share-card background (via the generated palette) |

### Semantic Status

| Token | Use |
|---|---|
| `--color-success-bg` / `--color-success-text` | Success banners, status dots, "active" pills |
| `--color-error-bg` / `--color-error-text` | Error banners, validation messages, failed status dots |
| `--color-warning-bg` / `--color-warning-text` | Warning banners, off-network and connecting states |
| `--color-warning-border` | Outline of a warning control (the network switcher) |
| `--color-error-outline` | Border of a red error card |
| `--color-error-border` / `--color-error-surface` | BackendUnavailable alert card |
| `--color-neutral-bg` / `--color-neutral-text` | Neutral (deactivated) pills |
| `--color-active-bg` / `--color-active-text` | Active status pills |

---

## Typography

Fonts are loaded via `next/font/google` in `app/layout.tsx` and exposed as CSS
variables.

| Variable | Font | Use |
|---|---|---|
| `--font-inter` | Inter | All body copy, labels, headings |
| `--font-jetbrains-mono` | JetBrains Mono | Addresses, hashes, amounts — apply via `.mono` class |

### Scale (Tailwind)

| Size | Class | Use |
|---|---|---|
| 10 px | `text-[10px]` | Status pills, micro-badges |
| 11 px | `text-[11px]` | Timestamps, secondary mono labels |
| 12 px | `text-xs` | Labels, captions, form field text |
| 13 px | `text-[13px]` | Table rows, list items |
| 14 px | `text-sm` | Default body, button labels |
| 17 px | `text-[17px]` | Navbar brand |
| 24 px+ | `text-3xl` | Page headings (`h1`) |

**Weights used:** 400 (body), 500, 600 (semibold labels), 700 (bold), 800 (extrabold headings).

---

## Spacing

Spacing follows Tailwind's default 4 px scale. Conventions:

| Context | Value | Tailwind |
|---|---|---|
| Gap between stacked list items | 8–10 px | `gap-2` / `gap-2.5` |
| Gap between card sections | 12 px | `gap-3` |
| Card internal padding | 16 px | `p-4` |
| Panel internal padding | 24 px | `p-6` |
| Page horizontal padding | 16 px / 28 px | `px-4 sm:px-7` |
| Page vertical padding | 48 px | `py-12` |
| Max content width | 1160 px | `max-w-[1160px] mx-auto` |

---

## Components

### Button (`components/ui/Button.tsx`)

The single source of truth for all interactive button elements.

```tsx
import { Button } from '@/components/ui/Button';

// Primary CTA
<Button variant="primary">Register Contract</Button>

// Secondary / outline
<Button variant="secondary" size="sm">Load more</Button>

// Destructive (confirm-before-proceed)
<Button variant="destructive" size="sm">Deactivate</Button>

// Ghost (tab switches, text-link buttons)
<Button variant="ghost">My Contracts</Button>

// Loading state
<Button variant="primary" loading loadingText="Submitting…">Submit</Button>
```

**Props**

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `primary \| secondary \| destructive \| ghost` | `primary` | Visual style |
| `size` | `sm \| md \| lg` | `md` | Padding / font-size |
| `loading` | `boolean` | `false` | Shows `loadingText`, sets `aria-busy`, disables the button |
| `loadingText` | `string` | children | Label while loading |
| `disabled` | `boolean` | `false` | Native disabled |

**Do ✓**
```tsx
<Button variant="primary" loading loadingText="Registering…">Register</Button>
```

**Don't ✗** — never re-implement loading/disabled inline:
```tsx
// ✗ do not do this
<button disabled={busy} className="bg-[#8b5cf6] disabled:opacity-50 …">
  {busy ? 'Registering…' : 'Register'}
</button>
```

---

### Cards / Panels

All cards use the same border + radius + background:

```tsx
<div className="border border-[var(--color-border-default)] rounded-xl p-4 bg-[var(--color-bg-subtle)]">
  …
</div>
```

Panels (sidebar boxes) use `rounded-2xl p-6`.

---

### Status pills

```tsx
// Active (green)
<span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-active-bg)] text-[var(--color-active-text)]">
  Active
</span>

// Neutral / deactivated
<span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-neutral-bg)] text-[var(--color-neutral-text)]">
  Deactivated
</span>
```

---

### Form inputs

```tsx
<input
  className="w-full min-h-[42px] px-3 py-2 text-sm
             bg-[var(--color-bg-base)]
             border border-[var(--color-border-default)]
             rounded-lg text-[var(--color-text-primary)]"
/>
```

Focus ring is applied globally in `globals.css` — do not add it manually.

---

### Banners

```tsx
// Success
<div role="status" className="text-xs text-[var(--color-success-text)] bg-[var(--color-success-bg)] rounded-lg px-3 py-2.5">
  Contract registered.
</div>

// Error
<div role="alert" className="text-xs text-[var(--color-error-text)] bg-[var(--color-error-bg)] rounded-lg px-3 py-2.5">
  Registration failed.
</div>
```

---

## Dark mode

The palette is driven by CSS custom properties. No component ever imports a
theme context or checks a JS flag.

- **System preference** — honoured automatically via `@media (prefers-color-scheme: dark)`.
- **Manual override** — the `ThemeToggle` in the Navbar cycles system → dark → light.
  It writes to `localStorage` and sets `data-theme` on `<html>`.
- **FOUC prevention** — `ThemeScript` (injected in `<head>` before CSS) reads
  `localStorage` and sets `data-theme` before the first paint.

To add a new colour: add it to all three blocks in `globals.css` — the `:root`
(light) block and the two dark blocks (`@media` + `[data-theme="dark"]`) — then
run `npm run codegen` to refresh `lib/generated/palette.ts`. Never hard-code a
hex in a component: `custom/no-raw-hex-colors` fails the lint on one.

---

## Adding a new page

1. Add an entry in `lib/routes.ts` — the navbar, sitemap, and robots.txt all
   read from it.
2. Use `px-4 sm:px-7 py-12` for page padding and `max-w-[1160px] mx-auto` for
   content width.
3. Use `var(--color-*)` tokens, not hex literals.
4. Use `<Button>` for all interactive buttons.
5. Add stories in `stories/` for any new shared component (see below).

---

## Component workshop (Ladle)

Stories live in `stories/`. Run the workshop with:

```bash
npx ladle serve
```

Build for CI:

```bash
npx ladle build
```

See `stories/Button.stories.tsx` for the canonical example of how to cover all
component states.
