// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AddressQRCode } from "./AddressQRCode";

const ADDRESS = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS";
const OTHER = "GZYXWVUTSRQPONMLKJIHGFEDCBA765432ZYXWVUTSRQPONMLKJIHGFEDCBA";
const DATA_PREFIX = "data:image/svg+xml;base64,";
const COPY_NAME = "Copy address to clipboard";

afterEach(cleanup);

/** The generated image is an SVG data URI; decode it back to markup. */
function decodeSource(src: string | null): string {
  expect(src?.startsWith(DATA_PREFIX)).toBe(true);
  return atob((src ?? "").slice(DATA_PREFIX.length));
}

describe("AddressQRCode", () => {
  it("names the code for assistive technology and gives the image alt text", () => {
    const { container } = render(<AddressQRCode address={ADDRESS} />);

    expect(
      screen.getByRole("img", { name: `QR code for Stellar address ${ADDRESS}` }),
    ).toBeTruthy();
    expect(container.querySelector("img")?.getAttribute("alt")).toBe(
      `QR code for ${ADDRESS}`,
    );
  });

  it("renders a 160px SVG image by default", () => {
    const { container } = render(<AddressQRCode address={ADDRESS} />);
    const img = container.querySelector("img");
    const svg = decodeSource(img?.getAttribute("src") ?? null);

    expect(img?.getAttribute("width")).toBe("160");
    expect(img?.getAttribute("height")).toBe("160");
    expect(svg).toContain('width="160"');
    expect(svg).toContain('viewBox="0 0 160 160"');
  });

  it("honours a custom size", () => {
    const { container } = render(<AddressQRCode address={ADDRESS} size={96} />);
    const img = container.querySelector("img");
    const svg = decodeSource(img?.getAttribute("src") ?? null);

    expect(img?.getAttribute("width")).toBe("96");
    expect(svg).toContain('viewBox="0 0 96 96"');
  });

  it("derives the image from the address, deterministically", () => {
    const { container, rerender } = render(<AddressQRCode address={ADDRESS} />);
    const first = container.querySelector("img")?.getAttribute("src");

    rerender(<AddressQRCode address={OTHER} />);
    const second = container.querySelector("img")?.getAttribute("src");
    expect(second).not.toBe(first);

    rerender(<AddressQRCode address={ADDRESS} />);
    expect(container.querySelector("img")?.getAttribute("src")).toBe(first);
  });

  it("regenerates the image when the size changes", () => {
    const { container, rerender } = render(<AddressQRCode address={ADDRESS} />);
    const before = container.querySelector("img")?.getAttribute("src");

    rerender(<AddressQRCode address={ADDRESS} size={96} />);
    const img = container.querySelector("img");

    expect(img?.getAttribute("src")).not.toBe(before);
    expect(img?.getAttribute("width")).toBe("96");
  });

  it("shows the address and a copy control by default", () => {
    render(<AddressQRCode address={ADDRESS} />);

    expect(screen.getByText(ADDRESS)).toBeTruthy();
    expect(screen.getByRole("button", { name: COPY_NAME })).toBeTruthy();
  });

  it("hides the address text and copy control when showAddress is false", () => {
    const { container } = render(
      <AddressQRCode address={ADDRESS} showAddress={false} />,
    );

    expect(screen.queryByText(ADDRESS)).toBeNull();
    expect(screen.queryByRole("button", { name: COPY_NAME })).toBeNull();
    expect(container.querySelector("img")).not.toBeNull();
  });

  it("renders the frame without an image when there is no address", () => {
    const { container } = render(<AddressQRCode address="" />);

    expect(container.querySelector('[role="img"]')).not.toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });
});
