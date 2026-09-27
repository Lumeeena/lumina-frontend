# Transaction explorer compiler boundary

## Decision

TanStack Virtual 3 exposes a mutable virtualizer instance. Memoizing its method
results can leave the visible window stale. The scroll container, row window and
spacers therefore live in `VirtualizedTransactionTable`, with `"use no memo"` and
one documented `react-hooks/incompatible-library` suppression at the hook call.
No virtualizer instance or virtual item escapes that component. Filter state,
URL updates, presets, pagination and the result count remain in
`TransactionExplorer`. The scroll sentinel is passed as a child, preserving its
position inside the scroll container.

Upstream did not enable React Compiler in Next.js: its warning came from ESLint.
This change enables **annotation mode** and adds `"use memo"` only to the explorer,
so the parent is actually compiled without opting the rest of the app in.
The async load handler uses promise callbacks because compiler 1.0.0 also bails
out on the previous `try`/`catch`/`finally` implementation. The success, error and
cleanup paths remain the same. The localStorage hydration effect retains a
narrow documented lint exception because its initial render must match SSR.

## Reproducible measurement

Run `npm run measure:compiler` after `npm ci`. The script compiles the original
explorer at `511bbce50b68350cecbf44e94d76017ca39c6df4` and the current two components
using the pinned Babel/React Compiler dependencies. An optional first argument
selects a different baseline Git revision. A shallow checkout must fetch the
baseline commit before running this comparison.

Measured on Node 22.14.0 with React Compiler 1.0.0:

| Component                  | Compiled functions | Memo cache slots | Compiler diagnostics               |
| -------------------------- | -----------------: | ---------------: | ---------------------------------- |
| Original explorer          |                  0 |                0 | Unsupported `finally` clause       |
| Updated explorer           |                  1 |               71 | None                               |
| Isolated virtualized table |                  0 |                0 | Incompatible library (intentional) |

The script fails if the updated parent stops compiling or the virtualizer starts
compiling. ESLint reports no incompatible-library warning outside that explicit
boundary. This measures compiler eligibility and generated memoization, **not**
frame time or a promised speedup on user hardware. Scroll-driven virtualizer
state is now owned by the child rather than rerendering the parent. Existing
component tests cover a 400-row list, preserved total spacer height, window
changes on scroll, zero parent renders during a scroll update, filtering, cursor
pagination and retries.

References: [React's incompatible-library rule](https://react.dev/reference/eslint-plugin-react-hooks/lints/incompatible-library)
and [the use no memo directive](https://react.dev/reference/react-compiler/directives/use-no-memo).
