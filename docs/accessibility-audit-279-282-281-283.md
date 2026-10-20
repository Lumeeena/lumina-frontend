# Accessibility audit: issues #279, #282, #281, and #283

This focused audit addresses the four shared-component accessibility issues.

## CopyAddressButton (#279)
- Keeps the native button role and localized accessible name.
- Adds a visible token-based focus ring and disables its color transition for reduced-motion preferences.
- Retains the polite live status announcement for success/failure.
- Adds regression coverage for the accessible name, focus, activation, and status region.

## LocaleSwitcher (#282)
- Keeps a native, explicitly labelled select so browser keyboard interaction and selection semantics remain available.
- Adds a visible token-based focus ring and reduced-motion handling for its transition.
- Adds coverage for accessible naming, focus, and changing the selected locale.

## LoadMoreFooter (#281)
- Announces request errors with `role="alert"`.
- Exposes loading state with `aria-busy` and a polite status announcement; the shared Button disables while loading.
- Keeps retry/load-more actions as native buttons with their localized visible labels.
- Adds coverage for error announcement, retry activation, and loading state.

## Navbar (#283)
- Names the navigation landmark and the home link.
- Marks the active route with `aria-current="page"`; hides the decorative wordmark SVG from assistive technology.
- Adds token-based focus styles and reduced-motion handling to navigation links.
- Adds coverage for landmark naming, active-page state, and focusable named controls.

## Verification notes
Tests were added under `components/__tests__`. The repository's automated Vitest suite, lint, production build, and browser-based axe scan were not executed by the GitHub file-edit workflow; CI should run them before merge. The tests are regression checks and do not replace a full browser/assistive-technology audit.
