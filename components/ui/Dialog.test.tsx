// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { Dialog } from "./Dialog";

afterEach(cleanup);

describe("Dialog", () => {
  it("renders when open", () => {
    render(
      <Dialog open={true} onClose={vi.fn()} title="Test Dialog">
        <p>Dialog content</p>
      </Dialog>
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Test Dialog")).toBeTruthy();
    expect(screen.getByText("Dialog content")).toBeTruthy();
  });

  it("does not render when closed", () => {
    render(
      <Dialog open={false} onClose={vi.fn()} title="Test Dialog">
        <p>Dialog content</p>
      </Dialog>
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes on Escape key", () => {
    const onClose = vi.fn();
    render(
      <Dialog open={true} onClose={onClose} title="Test Dialog">
        <p>Dialog content</p>
      </Dialog>
    );

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("closes on backdrop click", () => {
    const onClose = vi.fn();
    render(
      <Dialog open={true} onClose={onClose} title="Test Dialog">
        <p>Dialog content</p>
      </Dialog>
    );

    const backdrop = screen.getByRole("dialog").parentElement;
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it("does not close on panel click", () => {
    const onClose = vi.fn();
    render(
      <Dialog open={true} onClose={onClose} title="Test Dialog">
        <p>Dialog content</p>
      </Dialog>
    );

    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("returns focus to trigger on close", () => {
    const triggerRef = { current: document.createElement("button") };
    const onClose = vi.fn();

    render(
      <>
        <button ref={triggerRef as any}>Trigger</button>
        <Dialog open={true} onClose={onClose} title="Test Dialog" triggerRef={triggerRef as any}>
          <p>Dialog content</p>
        </Dialog>
      </>
    );

    // Focus should be in the dialog when open
    expect(document.activeElement).not.toBe(triggerRef.current);

    // Close the dialog
    onClose();
    render(
      <>
        <button ref={triggerRef as any}>Trigger</button>
        <Dialog open={false} onClose={onClose} title="Test Dialog" triggerRef={triggerRef as any}>
          <p>Dialog content</p>
        </Dialog>
      </>
    );

    // Focus should return to trigger
    expect(document.activeElement).toBe(triggerRef.current);
  });

  it("traps focus within the dialog", () => {
    render(
      <Dialog open={true} onClose={vi.fn()} title="Test Dialog">
        <button>First</button>
        <button>Second</button>
        <button>Third</button>
      </Dialog>
    );

    const buttons = screen.getAllByRole("button");
    const closeButton = buttons[0]; // Close button in header
    const firstButton = buttons[1];
    const secondButton = buttons[2];
    const thirdButton = buttons[3];

    // Tab should cycle through focusable elements
    closeButton.focus();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Tab" });
    expect(document.activeElement).toBe(firstButton);

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Tab" });
    expect(document.activeElement).toBe(secondButton);

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Tab" });
    expect(document.activeElement).toBe(thirdButton);

    // Tab at last should wrap to first
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Tab" });
    expect(document.activeElement).toBe(closeButton);

    // Shift+Tab should cycle backwards
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(thirdButton);
  });

  it("renders footer when provided", () => {
    render(
      <Dialog
        open={true}
        onClose={vi.fn()}
        title="Test Dialog"
        footer={<button>Footer Action</button>}
      >
        <p>Dialog content</p>
      </Dialog>
    );

    expect(screen.getByText("Footer Action")).toBeTruthy();
  });

  it("renders description when provided", () => {
    render(
      <Dialog
        open={true}
        onClose={vi.fn()}
        title="Test Dialog"
        description="Dialog description"
      >
        <p>Dialog content</p>
      </Dialog>
    );

    expect(screen.getByText("Dialog description")).toBeTruthy();
  });

  it("hides header when hideHeader is true", () => {
    render(
      <Dialog
        open={true}
        onClose={vi.fn()}
        title="Test Dialog"
        hideHeader
      >
        <p>Dialog content</p>
      </Dialog>
    );

    // Title should not be visible in the header
    expect(screen.queryByText("Test Dialog")).toBeNull();
    // But content should still render
    expect(screen.getByText("Dialog content")).toBeTruthy();
  });
});
