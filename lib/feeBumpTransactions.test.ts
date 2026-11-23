import { describe, it, expect } from "vitest";
import {
  isFeeBumpTransaction,
  formatFeeBump,
  getFeeBumpDescription,
  type FeeBumpTransaction,
} from "./feeBumpTransactions";

const INNER = {
  hash: "abc123",
  sourceAccount: "GSOURCE",
  operations: 1,
  successful: true,
};

const withInner: FeeBumpTransaction = {
  feePayerAccount: "GPAYER",
  feeCharged: "0.5",
  innerTransaction: INNER,
};

const withoutInner: FeeBumpTransaction = {
  feePayerAccount: "GPAYER",
  feeCharged: "2",
};

describe("isFeeBumpTransaction", () => {
  it("detects a fee bump when the fee payer differs from the source account", () => {
    expect(isFeeBumpTransaction("GSOURCE", "GPAYER")).toBe(true);
  });

  it("is not a fee bump when the fee payer is the source account", () => {
    expect(isFeeBumpTransaction("GSOURCE", "GSOURCE")).toBe(false);
  });

  it("is not a fee bump when no fee payer is supplied", () => {
    expect(isFeeBumpTransaction("GSOURCE")).toBe(false);
  });

  it("is not a fee bump when the fee payer is an empty string", () => {
    expect(isFeeBumpTransaction("GSOURCE", "")).toBe(false);
  });
});

describe("formatFeeBump", () => {
  it("reports the fee payer, the formatted fee and that an inner transaction is present", () => {
    expect(formatFeeBump(withInner)).toEqual({
      feePayerAddress: "GPAYER",
      feeAmount: "0.5",
      hasInnerTransaction: true,
    });
  });

  it("reports no inner transaction when the field is null", () => {
    const result = formatFeeBump({ ...withInner, innerTransaction: null });

    expect(result.hasInnerTransaction).toBe(false);
  });

  it("reports no inner transaction when the field is absent", () => {
    const result = formatFeeBump(withoutInner);

    expect(result.hasInnerTransaction).toBe(false);
    expect(result.feeAmount).toBe("2");
  });

  it("passes an unparseable fee through unchanged rather than throwing", () => {
    const result = formatFeeBump({
      ...withoutInner,
      feeCharged: "not-a-number",
    });

    expect(result.feeAmount).toBe("not-a-number");
  });
});

describe("getFeeBumpDescription", () => {
  it("describes an inner transaction as a fee bump paid by the fee payer", () => {
    expect(getFeeBumpDescription(withInner)).toBe(
      "Fee bump: 0.5 XLM paid by GPAYER",
    );
  });

  it("describes a plain fee when there is no inner transaction", () => {
    expect(getFeeBumpDescription(withoutInner)).toBe("Fee: 2 XLM");
  });

  it("describes a plain fee when the inner transaction is null", () => {
    expect(
      getFeeBumpDescription({ ...withInner, innerTransaction: null }),
    ).toBe("Fee: 0.5 XLM");
  });
});
