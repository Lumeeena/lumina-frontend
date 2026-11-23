import { describe, expect, it } from "vitest";
import { apiKeyProblem, maskApiKey, playgroundHeaders } from "./playgroundAuth";

describe("apiKeyProblem", () => {
  it("treats an empty key as unauthenticated rather than as a problem", () => {
    expect(apiKeyProblem("")).toBeNull();
    expect(apiKeyProblem("   ")).toBeNull();
  });

  it("accepts a key made of visible ASCII", () => {
    expect(apiKeyProblem("lum_live_9f8e7d6c5b4a")).toBeNull();
  });

  it("rejects a key with whitespace inside it", () => {
    expect(apiKeyProblem("lum_live 9f8e")).not.toBeNull();
    expect(apiKeyProblem("lum_live\n9f8e")).not.toBeNull();
  });

  it("rejects non-ASCII characters, which cannot be sent in a header", () => {
    expect(apiKeyProblem("lum_livé_key")).not.toBeNull();
  });

  it("rejects a key longer than the limit", () => {
    expect(apiKeyProblem("a".repeat(257))).not.toBeNull();
    expect(apiKeyProblem("a".repeat(256))).toBeNull();
  });
});

describe("playgroundHeaders", () => {
  it("sends only the content type when there is no key", () => {
    expect(playgroundHeaders("")).toEqual({ "Content-Type": "application/json" });
  });

  it("sends a bearer token with the trimmed key", () => {
    expect(playgroundHeaders("  lum_live_abc123  ")).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer lum_live_abc123",
    });
  });
});

describe("maskApiKey", () => {
  it("shows the first four and last four characters of a long key", () => {
    expect(maskApiKey("lum_live_9f8e7d6c")).toBe("lum_••••7d6c");
  });

  it("hides a short key entirely", () => {
    expect(maskApiKey("abcdefgh")).toBe("••••");
  });
});
