/** Match development diagnostics and React's production hydration error codes. */
export function isHydrationDiagnostic(message: string): boolean {
  return /hydrat|server(?:[- ]rendered)? HTML|Text content (?:did not|does not) match|Prop .* did not match|Minified React error #(418|423|425)/i.test(
    message,
  );
}

export function assertNoHydrationDiagnostics(messages: string[]): void {
  const mismatches = messages.filter(isHydrationDiagnostic);
  if (mismatches.length)
    throw new Error(`Hydration diagnostics:\n${mismatches.join("\n")}`);
}
