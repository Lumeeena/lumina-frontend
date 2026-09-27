import { describe, expect, it } from "vitest";
import {
  DEFAULT_NETWORK,
  NETWORKS,
  NETWORK_IDS,
  NETWORK_PARAM,
  isInternalHref,
  isNetworkId,
  parseNetwork,
  readNetwork,
  withNetwork,
} from "./network";

describe("the network catalogue", () => {
  it("offers the three Stellar networks, default first", () => {
    expect(NETWORK_IDS).toEqual(["mainnet", "testnet", "futurenet"]);
    expect(NETWORKS.map((network) => network.label)).toEqual([
      "Mainnet",
      "Testnet",
      "Futurenet",
    ]);
  });

  it("defaults to mainnet, which is what a URL with no parameter has always meant", () => {
    expect(DEFAULT_NETWORK).toBe("mainnet");
    expect(isNetworkId(DEFAULT_NETWORK)).toBe(true);
  });

  it("carries the passphrase each id stands for", () => {
    // The same strings `NEXT_PUBLIC_NETWORK_PASSPHRASE` holds for a deployment
    // of that network (docs/ENVIRONMENT_VARIABLES.md), so an id in a URL is
    // never an opaque label.
    expect(NETWORKS.map((network) => network.passphrase)).toEqual([
      "Public Global Stellar Network ; September 2015",
      "Test SDF Network ; September 2015",
      "Test SDF Future Network ; October 2022",
    ]);
  });
});

describe("isNetworkId", () => {
  it("accepts the ids and nothing else", () => {
    expect(isNetworkId("testnet")).toBe(true);
    expect(isNetworkId("futurenet")).toBe(true);
    // Case matters here: this is the canonical form, not the parsed one.
    expect(isNetworkId("TESTNET")).toBe(false);
    expect(isNetworkId("previewnet")).toBe(false);
    expect(isNetworkId(3)).toBe(false);
    expect(isNetworkId(null)).toBe(false);
    expect(isNetworkId(undefined)).toBe(false);
  });
});

describe("parseNetwork", () => {
  it("reads a value that names a network, ignoring case and padding", () => {
    expect(parseNetwork("testnet")).toBe("testnet");
    expect(parseNetwork("TESTNET")).toBe("testnet");
    expect(parseNetwork(" FutureNet ")).toBe("futurenet");
    expect(parseNetwork("mainnet")).toBe("mainnet");
  });

  it("returns null for anything that names none", () => {
    expect(parseNetwork("")).toBeNull();
    expect(parseNetwork("   ")).toBeNull();
    expect(parseNetwork("lolnet")).toBeNull();
    expect(parseNetwork(null)).toBeNull();
    expect(parseNetwork(undefined)).toBeNull();
  });
});

describe("readNetwork", () => {
  it("reads the parameter out of a search string, with or without the leading ?", () => {
    expect(readNetwork(`?${NETWORK_PARAM}=testnet`)).toBe("testnet");
    expect(readNetwork(`${NETWORK_PARAM}=testnet`)).toBe("testnet");
    expect(readNetwork("?a=1&network=futurenet&b=2")).toBe("futurenet");
    expect(readNetwork("?network=TESTNET")).toBe("testnet");
  });

  it("reads a URLSearchParams just the same", () => {
    expect(readNetwork(new URLSearchParams("network=testnet"))).toBe("testnet");
  });

  it("falls back to the default when the URL says nothing usable", () => {
    // A link naming a network we do not know must still render, as the default.
    expect(readNetwork("")).toBe(DEFAULT_NETWORK);
    expect(readNetwork("?network=")).toBe(DEFAULT_NETWORK);
    expect(readNetwork("?network=lolnet")).toBe(DEFAULT_NETWORK);
    expect(readNetwork("?network=mainnet")).toBe(DEFAULT_NETWORK);
    expect(readNetwork(new URLSearchParams(""))).toBe(DEFAULT_NETWORK);
    expect(readNetwork(null)).toBe(DEFAULT_NETWORK);
    expect(readNetwork(undefined)).toBe(DEFAULT_NETWORK);
  });
});

describe("isInternalHref", () => {
  it("accepts same-origin paths only", () => {
    expect(isInternalHref("/")).toBe(true);
    expect(isInternalHref("/explorer")).toBe(true);
    expect(isInternalHref("/accounts/GA?tab=1#activity")).toBe(true);
  });

  it("rejects anything that leaves this origin", () => {
    // Rewriting one of these would either point the parameter at another
    // server or produce a URL that resolves somewhere else entirely.
    expect(isInternalHref("//evil.example/explorer")).toBe(false);
    expect(isInternalHref("https://example.com/explorer")).toBe(false);
    expect(isInternalHref("mailto:hello@example.com")).toBe(false);
    expect(isInternalHref("#activity")).toBe(false);
    expect(isInternalHref("explorer")).toBe(false);
  });
});

describe("withNetwork", () => {
  it("adds the parameter to a path", () => {
    expect(withNetwork("/explorer", "testnet")).toBe(
      "/explorer?network=testnet",
    );
    expect(withNetwork("/", "futurenet")).toBe("/?network=futurenet");
  });

  it("writes nothing for the default network", () => {
    // This is what keeps every existing canonical URL canonical, and stops
    // `?network=mainnet` becoming a second spelling of the same page.
    expect(withNetwork("/explorer", "mainnet")).toBe("/explorer");
    expect(withNetwork("/explorer?network=testnet", "mainnet")).toBe("/explorer");
  });

  it("keeps every other parameter, including through a round trip", () => {
    expect(withNetwork("/search?q=order+123", "testnet")).toBe(
      "/search?q=order+123&network=testnet",
    );
    expect(withNetwork("/search?q=order+123", "mainnet")).toBe(
      "/search?q=order+123",
    );
    expect(withNetwork("/registry?contractId=CAY&network=testnet", "mainnet")).toBe(
      "/registry?contractId=CAY",
    );
    expect(withNetwork(withNetwork("/explorer", "testnet"), "testnet")).toBe(
      "/explorer?network=testnet",
    );
  });

  it("replaces an existing value rather than adding a second one", () => {
    expect(withNetwork("/explorer?network=testnet", "futurenet")).toBe(
      "/explorer?network=futurenet",
    );
    expect(withNetwork("/explorer?network=testnet&q=1", "testnet")).toBe(
      "/explorer?network=testnet&q=1",
    );
  });

  it("keeps a fragment last, and does not mistake one for a query", () => {
    expect(withNetwork("/accounts/GA#activity", "testnet")).toBe(
      "/accounts/GA?network=testnet#activity",
    );
    expect(withNetwork("/accounts/GA?a=1#b?c=2", "testnet")).toBe(
      "/accounts/GA?a=1&network=testnet#b?c=2",
    );
    expect(withNetwork("/accounts/GA?network=testnet#activity", "testnet")).toBe(
      "/accounts/GA?network=testnet#activity",
    );
  });

  it("leaves a `?` inside a value alone", () => {
    expect(withNetwork("/explorer?q=a?b", "testnet")).toBe(
      "/explorer?q=a%3Fb&network=testnet",
    );
  });

  it("returns hrefs that are not ours untouched", () => {
    expect(withNetwork("https://example.com/explorer", "testnet")).toBe(
      "https://example.com/explorer",
    );
    expect(withNetwork("//other.example/explorer", "testnet")).toBe(
      "//other.example/explorer",
    );
    expect(withNetwork("#activity", "testnet")).toBe("#activity");
  });
});
