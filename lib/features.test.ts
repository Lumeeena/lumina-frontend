import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isEnabled, getFeatureInfo, listFeatures } from "./features";

// features.ts reads process.env inside module-scope initializers, so we must
// reset the module between tests that change env vars.
describe("features (#461)", () => {
  describe("isEnabled", () => {
    it("returns false for the analytics flag when the env var is unset", () => {
      // Default: env var absent → defaultValue (false).
      delete process.env["NEXT_PUBLIC_FEATURE_ANALYTICS"];
      vi.resetModules();
      const { isEnabled: fresh } = await import("./features");
      expect(fresh("analytics")).toBe(false);
    });

    it('returns true when the env var is "true"', async () => {
      process.env["NEXT_PUBLIC_FEATURE_ANALYTICS"] = "true";
      vi.resetModules();
      const { isEnabled: fresh } = await import("./features");
      expect(fresh("analytics")).toBe(true);
      delete process.env["NEXT_PUBLIC_FEATURE_ANALYTICS"];
    });

    it('returns true when the env var is "1"', async () => {
      process.env["NEXT_PUBLIC_FEATURE_ANALYTICS"] = "1";
      vi.resetModules();
      const { isEnabled: fresh } = await import("./features");
      expect(fresh("analytics")).toBe(true);
      delete process.env["NEXT_PUBLIC_FEATURE_ANALYTICS"];
    });

    it('returns true when the env var is "yes"', async () => {
      process.env["NEXT_PUBLIC_FEATURE_ANALYTICS"] = "yes";
      vi.resetModules();
      const { isEnabled: fresh } = await import("./features");
      expect(fresh("analytics")).toBe(true);
      delete process.env["NEXT_PUBLIC_FEATURE_ANALYTICS"];
    });

    it('returns false when the env var is "false"', async () => {
      process.env["NEXT_PUBLIC_FEATURE_ANALYTICS"] = "false";
      vi.resetModules();
      const { isEnabled: fresh } = await import("./features");
      expect(fresh("analytics")).toBe(false);
      delete process.env["NEXT_PUBLIC_FEATURE_ANALYTICS"];
    });

    it("returns false for an unknown feature name", () => {
      // @ts-expect-error – intentionally passing an unknown key
      expect(isEnabled("nonexistent")).toBe(false);
    });
  });

  describe("getFeatureInfo", () => {
    it("returns a FeatureFlag object for a known feature", () => {
      const info = getFeatureInfo("analytics");
      expect(info).not.toBeNull();
      expect(info?.name).toBe("analytics");
      expect(typeof info?.description).toBe("string");
      expect(info?.description.length).toBeGreaterThan(0);
      expect(typeof info?.enabled).toBe("boolean");
    });

    it("includes an expiry date for the analytics flag", () => {
      const info = getFeatureInfo("analytics");
      expect(info?.expiry).toBeDefined();
      // Expiry should be a date string parseable as a date.
      expect(isNaN(Date.parse(info!.expiry!))).toBe(false);
    });

    it("returns null for an unknown feature name", () => {
      // @ts-expect-error – intentionally passing an unknown key
      expect(getFeatureInfo("nonexistent")).toBeNull();
    });
  });

  describe("listFeatures", () => {
    it("returns an array", () => {
      expect(Array.isArray(listFeatures())).toBe(true);
    });

    it("includes at least the analytics feature", () => {
      const names = listFeatures().map((f) => f.name);
      expect(names).toContain("analytics");
    });

    it("every entry has name, description and enabled fields", () => {
      for (const feature of listFeatures()) {
        expect(typeof feature.name).toBe("string");
        expect(typeof feature.description).toBe("string");
        expect(typeof feature.enabled).toBe("boolean");
      }
    });
  });
});
