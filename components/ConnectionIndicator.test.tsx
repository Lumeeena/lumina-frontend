// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ConnectionState } from "@/lib/subscriptions";
import ConnectionIndicator from "./ConnectionIndicator";

afterEach(cleanup);

// The status line carries a reason and sometimes a retry button alongside the
// label, so the label is read from its own element rather than from the whole
// element's text.
const labelFor = (state: ConnectionState) => {
  render(<ConnectionIndicator state={state} />);
  return screen.getByTestId("connection-label").textContent;
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

  it("says why the feed fell back and offers a retry", () => {
    const onRetry = vi.fn();
    render(<ConnectionIndicator state="disconnected" failureReason="refused" onRetry={onRetry} />);

    expect(screen.getByTestId("connection-reason").textContent).toBe("server refused the connection");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("explains the unsupported fallback without offering a retry that cannot help", () => {
    render(<ConnectionIndicator state="unsupported" onRetry={() => {}} />);

    expect(screen.getByTestId("connection-reason")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
  });
});
