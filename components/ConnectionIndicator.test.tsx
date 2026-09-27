// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    expect(labelFor("unsupported")).toBe(
      "POLLINGlive updates not supported here",
    );
  });

  it("exposes the state to assistive tech, not only as a colour", () => {
    render(<ConnectionIndicator state="reconnecting" />);
    const el = screen.getByRole("status");

    expect(el.getAttribute("aria-live")).toBe("polite");
    expect(el.getAttribute("data-state")).toBe("reconnecting");
  });

  it.each([
    ["idle", /may not be current/i],
    ["connecting", /most recently loaded data/i],
    ["connected", /stays current/i],
    ["reconnecting", /existing data remains visible/i],
    ["disconnected", /up to 30 seconds old/i],
    ["unsupported", /up to 30 seconds old/i],
  ] as const)("makes the %s freshness explanation reachable by keyboard", async (state, explanation) => {
    render(<ConnectionIndicator state={state} />);
    const disclosure = screen.getByRole("button", { name: /what does/i });

    disclosure.focus();
    expect(document.activeElement).toBe(disclosure);
    await userEvent.keyboard("{Enter}");

    expect(screen.getByText(explanation)).toBeTruthy();
    expect(disclosure.getAttribute("aria-expanded")).toBe("true");
  });

  it("opens the freshness explanation with a pointer click", () => {
    render(<ConnectionIndicator state="connected" />);

    fireEvent.click(screen.getByRole("button", { name: /what does live mean/i }));

    expect(screen.getByText(/server publishes them/i)).toBeTruthy();
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
    render(
      <ConnectionIndicator
        state="disconnected"
        failureReason="refused"
        onRetry={onRetry}
      />,
    );

    expect(screen.getByTestId("connection-reason").textContent).toBe(
      "server refused the connection",
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("explains the unsupported fallback without offering a retry that cannot help", () => {
    render(<ConnectionIndicator state="unsupported" onRetry={() => {}} />);

    expect(screen.getByTestId("connection-reason")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Retry connection" })).toBeNull();
  });
});
