// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import SorobanValue from "./SorobanValue";

const ADDRESS = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS";

afterEach(cleanup);

describe("SorobanValue", () => {
  it("renders nested vectors and structs with collapsible nesting", () => {
    render(
      <SorobanValue
        value={{ owner: ADDRESS, settings: [true, { mode: "safe" }] }}
      />,
    );

    expect(screen.getByText("Struct · 2")).toBeTruthy();
    expect(screen.getByText("Vector · 2")).toBeTruthy();
    expect(screen.getByText("mode:")).toBeTruthy();
    expect(screen.getByText("safe")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Copy" })).toHaveLength(1);
    expect(screen.getByText("GABCDEF...NOPQRS")).toBeTruthy();
  });

  it("keeps tagged i128 and u128 values as exact strings", () => {
    render(
      <SorobanValue
        value={{
          balance: { i128: "340282366920938463463374607431768211455" },
          limit: { u128: "99999999999999999999999999999999999999" },
        }}
      />,
    );

    expect(
      screen.getByText("340282366920938463463374607431768211455"),
    ).toBeTruthy();
    expect(
      screen.getByText("99999999999999999999999999999999999999"),
    ).toBeTruthy();
  });

  it("does not parse a bare integer string through JavaScript number", () => {
    const integer = "9007199254740993123456789";
    render(<SorobanValue value={integer} />);

    expect(screen.getByText(integer)).toBeTruthy();
  });

  it("parses serialized JSON and leaves non-JSON strings readable", () => {
    const { rerender } = render(<SorobanValue value='{"ok":true}' />);
    expect(screen.getByText("true")).toBeTruthy();

    rerender(<SorobanValue value="not decoded JSON" />);
    expect(screen.getByText("not decoded JSON")).toBeTruthy();
  });

  it("renders tagged Soroban maps and byte values", () => {
    render(
      <SorobanValue
        value={{
          attributes: {
            map: [{ key: { symbol: "name" }, val: { string: "Lumina" } }],
          },
          payload: { bytes: [0, 15, 255] },
        }}
      />,
    );

    expect(screen.getByText("Map · 1")).toBeTruthy();
    expect(screen.getByText("0x000fff")).toBeTruthy();
    expect(screen.getByText("Lumina")).toBeTruthy();
  });
});
