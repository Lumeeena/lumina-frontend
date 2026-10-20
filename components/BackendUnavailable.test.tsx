// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import BackendUnavailable from "./BackendUnavailable";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ refresh: vi.fn() })),
}));

afterEach(cleanup);

describe("BackendUnavailable accessibility", () => {
  it("exposes a named alert and lets keyboard users retry", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<BackendUnavailable onRetry={onRetry} />);

    expect(screen.getByRole("alert", { name: /backend unavailable/i })).toBeTruthy();
    const retry = screen.getByRole("button", { name: "Retry" });
    await user.tab();
    expect(document.activeElement).toBe(retry);
    await user.keyboard("{Enter}");
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("refreshes the route when no retry callback is supplied", async () => {
    const refresh = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ refresh } as ReturnType<typeof useRouter>);
    const user = userEvent.setup();
    render(<BackendUnavailable />);
    await user.tab();
    await user.keyboard("{Enter}");
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
