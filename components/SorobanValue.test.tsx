// @vitest-environment jsdom
import { afterEach, describe, expect, it, beforeEach, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SorobanValue from "./SorobanValue";

const ADDRESS = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS";

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
});

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
    expect(
      screen.getAllByRole("button", { name: /copy address/i }),
    ).toHaveLength(1);
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

  describe("Raw XDR toggle - Issue #61", () => {
    it("shows raw XDR toggle button when enabled", () => {
      render(
        <SorobanValue
          value={{ string: "test" }}
          showRawToggle
          rawValue="AAAAAQAAAAA="
        />,
      );
      expect(screen.getByRole("button", { name: /Raw XDR|Decoded/ })).toBeTruthy();
    });

    it("displays decoded view by default", () => {
      render(
        <SorobanValue
          value={{ string: "test" }}
          showRawToggle
          rawValue="AAAAAQAAAAA="
        />,
      );
      expect(screen.getByText("test")).toBeTruthy();
    });

    it("toggles to raw XDR view on button click", async () => {
      const user = userEvent.setup();
      render(
        <SorobanValue
          value={{ string: "test" }}
          showRawToggle
          rawValue="AAAAAQAAAAA="
        />,
      );

      const button = screen.getByRole("button", { name: /Raw XDR|Decoded/ });
      await user.click(button);

      expect(screen.getByText("AAAAAQAAAAA=")).toBeTruthy();
    });

    it("persists raw toggle preference in sessionStorage", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <SorobanValue
          value={{ string: "test" }}
          showRawToggle
          rawValue="AAAAAQAAAAA="
        />,
      );

      const button = screen.getByRole("button", { name: /Raw XDR|Decoded/ });
      await user.click(button);

      expect(sessionStorage.getItem("soroban-raw-toggle")).toBe("true");

      rerender(
        <SorobanValue
          value={{ string: "test" }}
          showRawToggle
          rawValue="AAAAAQAAAAA="
        />,
      );

      expect(screen.getByText("AAAAAQAAAAA=")).toBeTruthy();
    });

    it("makes raw value copyable", async () => {
      const user = userEvent.setup();
      const clipboardSpy = vi.spyOn(navigator.clipboard, "writeText");

      render(
        <SorobanValue
          value={{ string: "test" }}
          showRawToggle
          rawValue="AAAAAQAAAAA="
        />,
      );

      const toggleButton = screen.getByRole("button", { name: /Raw XDR|Decoded/ });
      await user.click(toggleButton);

      const copyButton = screen.getByRole("button", { name: /Copy/ });
      await user.click(copyButton);

      expect(clipboardSpy).toHaveBeenCalledWith("AAAAAQAAAAA=");
    });

    it("handles i128 boundary values with raw toggle", () => {
      const { container } = render(
        <SorobanValue
          value={{ i128: "-170141183460469231731687303715884105728" }}
          showRawToggle
          rawValue="AAAA...AAAA"
        />,
      );
      expect(container.textContent).toContain("170141183460469231731687303715884105728");
    });

    it("handles u128 boundary values with raw toggle", () => {
      const { container } = render(
        <SorobanValue
          value={{ u128: "340282366920938463463374607431768211455" }}
          showRawToggle
          rawValue="AAAA...AAAA"
        />,
      );
      expect(container.textContent).toContain("340282366920938463463374607431768211455");
    });
  });

  describe("Real SDK fixtures - Issue #60", () => {
    it("renders SDK-encoded transfer event with all fields", () => {
      const transferEvent = {
        map: [
          { key: { symbol: "from" }, val: { address: "GBRPYHIL2CI3FV4BSXVQQ5SSC7IEZ6CYSYY3USI2A7JTLX2C5DHHHB" } },
          { key: { symbol: "to" }, val: { address: "GBBD47UZQ5CHLYFFQ5BIQVQSOAWGI6ZQJJLVCAN2GFDV34PJW2KTMO" } },
          { key: { symbol: "amount" }, val: { i128: "1000000" } },
        ],
      };

      const { container } = render(<SorobanValue value={transferEvent} />);
      expect(container.textContent).toContain("Map");
      expect(container.textContent).toContain("1000000");
    });

    it("renders nested contract data structures", () => {
      const nestedData = {
        vec: [
          {
            map: [
              { key: { u64: "0" }, val: { symbol: "initialized" } },
              { key: { u64: "1" }, val: { u64: "123456789" } },
            ],
          },
          {
            map: [
              { key: { u64: "0" }, val: { symbol: "paused" } },
              { key: { u64: "1" }, val: { bool: true } },
            ],
          },
        ],
      };

      const { container } = render(<SorobanValue value={nestedData} />);
      expect(container.textContent).toContain("Vector");
      expect(container.textContent).toContain("Map");
    });

    it("renders bytes from contract payload", () => {
      const payload = new Uint8Array([
        0xca, 0xfe, 0xba, 0xbe, 0xde, 0xad, 0xbe, 0xef,
      ]);
      const { container } = render(<SorobanValue value={payload} />);
      expect(container.textContent).toContain("0xcafebabedeadbeef");
    });

    it("handles complex struct with mixed types", () => {
      const complexStruct = {
        user: {
          id: { u64: "12345" },
          name: { string: "Alice" },
          active: { bool: true },
          balance: { i128: "999999999999999" },
          metadata: {
            map: [
              { key: { symbol: "tier" }, val: { string: "premium" } },
              { key: { symbol: "joined" }, val: { u64: "1609459200" } },
            ],
          },
        },
      };

      const { container } = render(<SorobanValue value={complexStruct} />);
      expect(container.textContent).toContain("Struct");
      expect(container.textContent).toContain("Alice");
      expect(container.textContent).toContain("premium");
    });

    it("handles error type from contract execution", () => {
      const error = { error: { contract: 5, code: 123 } };
      const { container } = render(<SorobanValue value={error} />);
      expect(container.textContent).toContain("contract");
    });

    it("preserves precision for u256 edge cases", () => {
      const largeNumber = "115792089237316195423570985008687907853269984665640564039457584007913129639935";
      const { container } = render(
        <SorobanValue value={{ u256: largeNumber }} />
      );
      expect(container.textContent).toContain(largeNumber);
    });

    it("preserves precision for i256 negative boundary", () => {
      const negBoundary = "-57896044618658097711785492504343953926634992332820282019728792003956564819968";
      const { container } = render(
        <SorobanValue value={{ i256: negBoundary }} />
      );
      expect(container.textContent).toContain(negBoundary);
    });

    it("handles deeply nested structures", () => {
      const deepNested = {
        vec: [
          {
            vec: [
              {
                vec: [
                  { u64: "1" },
                  { u64: "2" },
                ],
              },
            ],
          },
        ],
      };

      const { container } = render(
        <SorobanValue value={deepNested} initialExpandedDepth={4} />
      );
      expect(container.textContent).toContain("Vector");
    });
  });
});
