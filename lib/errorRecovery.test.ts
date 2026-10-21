import { describe, expect, it } from "vitest";
import { queryRecovery, transactionRecovery } from "./errorRecovery";

describe("error recovery guidance", () => {
  it("does not invite a second submission when the first may still confirm", () => {
    expect(transactionRecovery("Submitted but pending confirmation")).toMatch(
      /check the transaction.*before submitting again/i,
    );
  });

  it("distinguishes a declined signature from a balance problem", () => {
    expect(transactionRecovery("Signature was declined in your wallet")).toMatch(/approve.*wallet/i);
    expect(transactionRecovery("Insufficient balance")).toMatch(/wallet balance/i);
  });

  it("states when the current wallet cannot complete the action", () => {
    expect(transactionRecovery("Unsupported wallet")).toMatch(/cannot complete/i);
  });

  it("asks query authors to fix a validation error and rate-limited users to wait", () => {
    expect(queryRecovery("Unknown field accountz")).toMatch(/check the query/i);
    expect(queryRecovery("Too many requests", true)).toMatch(/wait for the rate limit/i);
  });
});
