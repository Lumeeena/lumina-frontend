if (typeof window !== "undefined") {
  import("@testing-library/jest-dom/vitest");
}
import { afterEach, beforeEach, vi } from 'vitest';
import { assertNoHydrationDiagnostics } from './test-support/hydration';

let diagnostics: string[];
let restoreConsole: () => void;
beforeEach(() => {
  diagnostics = [];
  const error = console.error.bind(console);
  const warn = console.warn.bind(console);
  const errorSpy = vi.spyOn(console, 'error').mockImplementation((...args) => {
    diagnostics.push(args.map(String).join(' '));
    error(...args);
  });
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation((...args) => {
    diagnostics.push(args.map(String).join(' '));
    warn(...args);
  });
  restoreConsole = () => { errorSpy.mockRestore(); warnSpy.mockRestore(); };
});
afterEach(() => {
  restoreConsole();
  assertNoHydrationDiagnostics(diagnostics);
});
