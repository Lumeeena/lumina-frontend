import { describe, expect, it } from "vitest";
import { classifySearch, searchHref } from "./searchQuery";

const ACCOUNT = "GBWKFFXZ5CJESIHP2EOID5IOXMF472RO5XOJ36X475D5LJGI3AF5R5KY";
const CONTRACT = "CAYUDQPV3RKPM3EXDFGI3457FV677JLUCJ4OLKWGCUBPRIHYKXK3WFAZ";
const HASH = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

describe("classifySearch", () => {
  it("recognises an account address by its G shape", () => {
    expect(classifySearch(ACCOUNT)).toEqual({
      kind: "account",
      value: ACCOUNT,
    });
  });

  it("recognises a contract id by its C shape", () => {
    expect(classifySearch(CONTRACT)).toEqual({
      kind: "contract",
      value: CONTRACT,
    });
  });

  it("recognises a transaction hash by its 64 hex characters", () => {
    expect(classifySearch(HASH)).toEqual({
      kind: "transaction",
      value: HASH,
    });
  });

  it("normalises addresses to upper case, as Stellar canonicalises them", () => {
    expect(classifySearch(ACCOUNT.toLowerCase())).toEqual({
      kind: "account",
      value: ACCOUNT,
    });
    expect(classifySearch(CONTRACT.toLowerCase())).toEqual({
      kind: "contract",
      value: CONTRACT,
    });
  });

  it("normalises hashes to lower case", () => {
    expect(classifySearch(HASH.toUpperCase())).toEqual({
      kind: "transaction",
      value: HASH,
    });
  });

  it("trims surrounding whitespace before classifying", () => {
    expect(classifySearch(`  ${ACCOUNT}  `)).toEqual({
      kind: "account",
      value: ACCOUNT,
    });
  });

  it("treats anything unrecognised as memo text", () => {
    expect(classifySearch("order 12345")).toEqual({
      kind: "memo",
      value: "order 12345",
    });
  });

  it("does not mistake a near-address for an account", () => {
    // 56 characters and a G, but 1 and 0 are outside Strkey's alphabet.
    const typo = `G${"A".repeat(54)}1`;
    expect(classifySearch(typo)).toEqual({ kind: "memo", value: typo });
  });

  it("does not mistake a short hex string for a transaction hash", () => {
    expect(classifySearch("abcdef1234")).toEqual({
      kind: "memo",
      value: "abcdef1234",
    });
  });

  it("returns null for empty or whitespace-only input", () => {
    expect(classifySearch("")).toBeNull();
    expect(classifySearch("   ")).toBeNull();
  });
});

describe("searchHref", () => {
  it("routes an account to its account page", () => {
    expect(searchHref({ kind: "account", value: ACCOUNT })).toBe(
      `/accounts/${ACCOUNT}`,
    );
  });

  it("routes a contract id to the events page filtered by it", () => {
    expect(searchHref({ kind: "contract", value: CONTRACT })).toBe(
      `/events?contractId=${CONTRACT}`,
    );
  });

  it("routes a transaction hash to its transaction page", () => {
    expect(searchHref({ kind: "transaction", value: HASH })).toBe(
      `/transactions/${HASH}`,
    );
  });

  it("routes memo text to the search page, encoded for the URL", () => {
    expect(searchHref({ kind: "memo", value: "order 12345" })).toBe(
      "/search?q=order%2012345",
    );
  });
});
