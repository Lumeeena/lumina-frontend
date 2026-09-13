// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ConnectionState } from "@/lib/subscriptions";
import ConnectionIndicator from "./ConnectionIndicator";

afterEach(cleanup);

const labelFor = (state: ConnectionState) => {
  render(<ConnectionIndicator state={state} />);
  return screen.getByTestId("connection-indicator").textContent;
};

describe("ConnectionIndicator", () => {
  it("labels each connection state", () => {
    expect(labelFor("idle")).toBe("IDLE");
    cleanup();
    expect(labelFor("connecting")).toBe("CONNECTING");
    cleanup();
    expect(labelFor("connected")).toBe("LIVE");
    cleanup();
    expect(labelFor("reconnecting")).toBe("RECONNECTING");
  });

  it("says POLLING rather than claiming live when the socket is gone", () => {
    // The distinction the component exists for: a stalled feed must not keep
    // showing a green LIVE dot.
    expect(labelFor("disconnected")).toBe("POLLING");
    cleanup();
    expect(labelFor("unsupported")).toBe("POLLING");
  });

  it("exposes the state to assistive tech, not only as a colour", () => {
    render(<ConnectionIndicator state="reconnecting" />);
    const el = screen.getByRole("status");

    expect(el.getAttribute("aria-live")).toBe("polite");
    expect(el.getAttribute("data-state")).toBe("reconnecting");
    expect(el.getAttribute("title")).toContain("retrying");
  });

  it("animates only while a connection is in progress", () => {
    const { container } = render(<ConnectionIndicator state="connecting" />);
    expect(container.querySelector(".animate-pulse")).not.toBeNull();
    cleanup();

    const settled = render(<ConnectionIndicator state="connected" />);
    expect(settled.container.querySelector(".animate-pulse")).toBeNull();
  });
});
