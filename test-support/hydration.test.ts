import { expect, it } from "vitest";
import {
  assertNoHydrationDiagnostics,
  isHydrationDiagnostic,
} from "./hydration";

it.each([
  "Hydration failed because the server rendered HTML did not match",
  "Text content did not match. Server: %s Client: %s",
  "Minified React error #418",
  "Minified React error #423",
])("fails the CI guard for %s", (message) => {
  expect(isHydrationDiagnostic(message)).toBe(true);
  expect(() => assertNoHydrationDiagnostics([message])).toThrow(
    "Hydration diagnostics",
  );
});

it("does not confuse a wallet network mismatch with a React hydration failure", () => {
  expect(() =>
    assertNoHydrationDiagnostics([
      "Wallet network does not match the requested network",
    ]),
  ).not.toThrow();
});
