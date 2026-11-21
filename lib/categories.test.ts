import { describe, expect, it } from "vitest";
import { REGISTRY_CATEGORIES, type RegistryCategory } from "./categories";

describe("REGISTRY_CATEGORIES (#460)", () => {
  it("contains the expected canonical values", () => {
    expect(REGISTRY_CATEGORIES).toEqual([
      "DeFi",
      "Nft",
      "Gaming",
      "Identity",
      "Infrastructure",
      "Payments",
      "Oracle",
      "Dao",
      "Other",
    ]);
  });

  it("is a non-empty readonly tuple", () => {
    expect(REGISTRY_CATEGORIES.length).toBeGreaterThan(0);
  });

  it("includes DeFi", () => {
    expect(REGISTRY_CATEGORIES).toContain("DeFi");
  });

  it("includes Other as a catch-all", () => {
    expect(REGISTRY_CATEGORIES).toContain("Other");
  });

  it("every entry is a non-empty string", () => {
    for (const cat of REGISTRY_CATEGORIES) {
      expect(typeof cat).toBe("string");
      expect(cat.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate entries", () => {
    const unique = new Set(REGISTRY_CATEGORIES);
    expect(unique.size).toBe(REGISTRY_CATEGORIES.length);
  });

  it("RegistryCategory type is assignable from each member", () => {
    // Type-level check: each element should be a valid RegistryCategory.
    const first: RegistryCategory = REGISTRY_CATEGORIES[0];
    expect(first).toBe("DeFi");
  });

  it("supports lookup by value", () => {
    const lookup = (name: string): RegistryCategory | undefined =>
      REGISTRY_CATEGORIES.find((c) => c === name);

    expect(lookup("Gaming")).toBe("Gaming");
    expect(lookup("NotACategory")).toBeUndefined();
  });

  it("supports index-based access", () => {
    expect(REGISTRY_CATEGORIES[0]).toBe("DeFi");
    expect(REGISTRY_CATEGORIES[REGISTRY_CATEGORIES.length - 1]).toBe("Other");
  });
});
