import { describe, expect, it } from "vitest";
import { checkReserve, minimumBalance } from "./reserve";

const XLM = BigInt(10_000_000);

describe("minimumBalance", () => {
  it("reserves 1 XLM for an account that owns nothing", () => {
    expect(minimumBalance(0)).toBe(XLM);
  });

  it("adds 0.5 XLM for each entry the account owns", () => {
    expect(minimumBalance(4)).toBe(XLM * BigInt(3));
  });
});

describe("checkReserve", () => {
  it("passes when the balance stays at or above the reserve", () => {
    const result = checkReserve(XLM * BigInt(10), 0, XLM * BigInt(9));
    expect(result.breaches).toBe(false);
    expect(result.remaining).toBe(XLM);
  });

  it("breaches when the cost takes the balance below the reserve", () => {
    const result = checkReserve(XLM * BigInt(10), 0, XLM * BigInt(9) + BigInt(1));
    expect(result.breaches).toBe(true);
    expect(result.minimum).toBe(XLM);
  });

  it("counts owned entries towards the reserve", () => {
    // 3 XLM is fine with nothing owned (1 XLM reserve), but not with 6 entries (4 XLM reserve).
    expect(checkReserve(XLM * BigInt(3), 0, BigInt(0)).breaches).toBe(false);
    expect(checkReserve(XLM * BigInt(3), 6, BigInt(0)).breaches).toBe(true);
  });
});
