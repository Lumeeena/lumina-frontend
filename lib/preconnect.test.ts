import { describe, expect, it } from "vitest";
import { preconnectOrigins } from "./preconnect";

describe("preconnectOrigins", () => {
  it("reduces each URL to its origin, dropping the path and query", () => {
    expect(
      preconnectOrigins([
        "https://api.example.com/graphql?x=1",
        "https://rpc.example.com:8443/soroban",
      ]),
    ).toEqual(["https://api.example.com", "https://rpc.example.com:8443"]);
  });

  it("returns each origin once when two URLs share one", () => {
    expect(
      preconnectOrigins([
        "https://api.example.com/graphql",
        "https://api.example.com/other",
      ]),
    ).toEqual(["https://api.example.com"]);
  });

  it("skips relative URLs, which have no origin to connect to", () => {
    expect(preconnectOrigins(["/graphql", "https://rpc.example.com"])).toEqual([
      "https://rpc.example.com",
    ]);
  });

  it("skips values that are not URLs rather than failing the render", () => {
    expect(preconnectOrigins(["", "not a url", "https://rpc.example.com"])).toEqual([
      "https://rpc.example.com",
    ]);
  });

  it("skips non-HTTP schemes, which a preconnect hint cannot use", () => {
    expect(
      preconnectOrigins(["ws://localhost:4000/graphql", "wss://ws.example.com"]),
    ).toEqual([]);
  });

  it("keeps plain http origins, as a local backend uses", () => {
    expect(preconnectOrigins(["http://localhost:4000/graphql"])).toEqual([
      "http://localhost:4000",
    ]);
  });
});
