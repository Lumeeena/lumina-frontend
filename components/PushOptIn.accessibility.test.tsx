// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { wcagViolations } from "@/lib/axeScan";
import PushOptIn from "./PushOptIn";

// Mock the push notification library
const mockCurrentPushState = vi.hoisted(() => vi.fn());
const mockEnablePush = vi.hoisted(() => vi.fn());
const mockDisablePush = vi.hoisted(() => vi.fn());

vi.mock("@/lib/pushNotifications", () => ({
  VAPID_PUBLIC_KEY: "test-key",
  currentPushState: mockCurrentPushState,
  enablePush: mockEnablePush,
  disablePush: mockDisablePush,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("PushOptIn accessibility", () => {
  it("passes automated accessibility scan in default state", async () => {
    mockCurrentPushState.mockResolvedValue("default");
    const { container } = render(<PushOptIn />);
    
    // Wait for state to load
    await screen.findByTestId("push-state");
    
    const violations = await wcagViolations(container);
    expect(violations).toEqual([]);
  });

  it("passes automated accessibility scan in subscribed state", async () => {
    mockCurrentPushState.mockResolvedValue("subscribed");
    const { container } = render(<PushOptIn />);
    
    await screen.findByTestId("push-state");
    
    const violations = await wcagViolations(container);
    expect(violations).toEqual([]);
  });

  it("passes automated accessibility scan in denied state", async () => {
    mockCurrentPushState.mockResolvedValue("denied");
    const { container } = render(<PushOptIn />);
    
    await screen.findByTestId("push-state");
    
    const violations = await wcagViolations(container);
    expect(violations).toEqual([]);
  });

  it("passes automated accessibility scan in unsupported state", async () => {
    mockCurrentPushState.mockResolvedValue("unsupported");
    const { container } = render(<PushOptIn />);
    
    await screen.findByTestId("push-state");
    
    const violations = await wcagViolations(container);
    expect(violations).toEqual([]);
  });

  it("supports keyboard interaction for enable button", async () => {
    mockCurrentPushState.mockResolvedValue("default");
    mockEnablePush.mockResolvedValue("subscribed");
    
    render(<PushOptIn />);
    const user = userEvent.setup();
    
    const enableButton = await screen.findByTestId("push-enable");
    
    // Focus and activate with keyboard
    enableButton.focus();
    expect(enableButton).toHaveFocus();
    
    await user.keyboard("{Enter}");
    expect(mockEnablePush).toHaveBeenCalled();
  });

  it("supports keyboard interaction for disable button", async () => {
    mockCurrentPushState.mockResolvedValue("subscribed");
    mockDisablePush.mockResolvedValue("default");
    
    render(<PushOptIn />);
    const user = userEvent.setup();
    
    const disableButton = await screen.findByRole("button", { name: /turn off/i });
    
    // Focus and activate with keyboard
    disableButton.focus();
    expect(disableButton).toHaveFocus();
    
    await user.keyboard("{Enter}");
    expect(mockDisablePush).toHaveBeenCalled();
  });

  it("disables buttons during async operations", async () => {
    mockCurrentPushState.mockResolvedValue("default");
    mockEnablePush.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve("subscribed"), 100);
    }));
    
    render(<PushOptIn />);
    const user = userEvent.setup();
    
    const enableButton = await screen.findByTestId("push-enable");
    await user.click(enableButton);
    
    // Button should be disabled while loading
    expect(enableButton).toBeDisabled();
  });
});
