// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import AddressLabelManager from "./AddressLabelManager";
import { ADDRESS_LABELS_KEY } from "@/lib/addressLabels";

const ADDRESS = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRS";
const OTHER = "GZYXWVUTSRQPONMLKJIHGFEDCBA765432ZYXWVUTSRQPONMLKJIHGFEDCBA";

function storedLabels(): Record<string, string> {
  const raw = window.localStorage.getItem(ADDRESS_LABELS_KEY);
  return raw ? JSON.parse(raw) : {};
}

function openManager() {
  fireEvent.click(screen.getByRole("button", { name: "Labels" }));
  return screen.getByRole("dialog", { name: "Address Labels" });
}

function addLabel(address: string, label: string) {
  fireEvent.change(screen.getByPlaceholderText("Stellar address"), {
    target: { value: address },
  });
  fireEvent.change(screen.getByPlaceholderText("Label"), {
    target: { value: label },
  });
  fireEvent.click(screen.getByRole("button", { name: "Add Label" }));
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("AddressLabelManager", () => {
  it("opens from the Labels button with no saved labels", () => {
    openManager();
    expect(screen.getByRole("heading", { name: "Add New Label" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Your Labels" })).toBeNull();
  });

  it("adds a label and lists it with a truncated address", () => {
    openManager();
    addLabel(ADDRESS, "Exchange hot wallet");

    expect(storedLabels()).toEqual({ [ADDRESS]: "Exchange hot wallet" });
    expect(screen.getByRole("heading", { name: "Your Labels" })).toBeTruthy();
    expect(screen.getByText("Exchange hot wallet")).toBeTruthy();
    expect(screen.getByText("GABCD...PQRS")).toBeTruthy();
    expect(
      (screen.getByPlaceholderText("Stellar address") as HTMLInputElement).value,
    ).toBe("");
  });

  it("does not add a label unless both the address and the label have text", () => {
    openManager();
    addLabel("   ", "Label without an address");
    addLabel(ADDRESS, "   ");

    expect(window.localStorage.getItem(ADDRESS_LABELS_KEY)).toBeNull();
    expect(screen.queryByRole("heading", { name: "Your Labels" })).toBeNull();
  });

  it("adds a label when Enter is pressed in the label field", () => {
    openManager();
    fireEvent.change(screen.getByPlaceholderText("Stellar address"), {
      target: { value: ADDRESS },
    });
    const labelInput = screen.getByPlaceholderText("Label");
    fireEvent.change(labelInput, { target: { value: "Via keyboard" } });
    fireEvent.keyDown(labelInput, { key: "Enter" });

    expect(storedLabels()).toEqual({ [ADDRESS]: "Via keyboard" });
  });

  it("edits a label in place and saves it", () => {
    openManager();
    addLabel(ADDRESS, "Old name");

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    const editInput = screen.getByDisplayValue("Old name");
    fireEvent.change(editInput, { target: { value: "New name" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(storedLabels()).toEqual({ [ADDRESS]: "New name" });
    expect(screen.getByText("New name")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
  });

  it("saves an edit on Enter", () => {
    openManager();
    addLabel(ADDRESS, "Old name");

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    const editInput = screen.getByDisplayValue("Old name");
    fireEvent.change(editInput, { target: { value: "Saved with Enter" } });
    fireEvent.keyDown(editInput, { key: "Enter" });

    expect(storedLabels()).toEqual({ [ADDRESS]: "Saved with Enter" });
  });

  it("keeps the edit open and the stored label unchanged when the edit is blank", () => {
    openManager();
    addLabel(ADDRESS, "Keep me");

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByDisplayValue("Keep me"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(storedLabels()).toEqual({ [ADDRESS]: "Keep me" });
    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
  });

  it("does not store an edit that Escape cancels", () => {
    openManager();
    addLabel(ADDRESS, "Original");

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByDisplayValue("Original"), {
      target: { value: "Abandoned" },
    });
    fireEvent.keyDown(screen.getByDisplayValue("Abandoned"), { key: "Escape" });

    expect(storedLabels()).toEqual({ [ADDRESS]: "Original" });
    expect(screen.queryByDisplayValue("Abandoned")).toBeNull();
  });

  it("removes a label and drops the list when none are left", () => {
    openManager();
    addLabel(ADDRESS, "Temporary");

    fireEvent.click(screen.getByRole("button", { name: "Delete label" }));

    expect(storedLabels()).toEqual({});
    expect(screen.queryByText("Temporary")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Your Labels" })).toBeNull();
  });

  it("removes only the chosen label when several are saved", () => {
    openManager();
    addLabel(ADDRESS, "First");
    addLabel(OTHER, "Second");

    fireEvent.click(screen.getAllByRole("button", { name: "Delete label" })[0]);

    expect(storedLabels()).toEqual({ [OTHER]: "Second" });
    expect(screen.getByText("Second")).toBeTruthy();
    expect(screen.queryByText("First")).toBeNull();
  });

  it("shows labels saved before the dialog was opened", () => {
    window.localStorage.setItem(
      ADDRESS_LABELS_KEY,
      JSON.stringify({ [ADDRESS]: "Saved earlier" }),
    );
    openManager();

    expect(screen.getByText("Saved earlier")).toBeTruthy();
    expect(screen.getByText("GABCD...PQRS")).toBeTruthy();
  });

  it("reports a file that is not a label object instead of importing it", async () => {
    openManager();
    const fileInput = screen.getByLabelText("Import labels file");
    fireEvent.change(fileInput, {
      target: {
        files: [new File(["[]"], "labels.json", { type: "application/json" })],
      },
    });

    expect(await screen.findByText("Invalid label format")).toBeTruthy();
    expect(window.localStorage.getItem(ADDRESS_LABELS_KEY)).toBeNull();
  });

  it("imports a label file and lists its labels", async () => {
    openManager();
    const payload = JSON.stringify({ [ADDRESS]: "Imported" });
    fireEvent.change(screen.getByLabelText("Import labels file"), {
      target: {
        files: [new File([payload], "labels.json", { type: "application/json" })],
      },
    });

    await waitFor(() => expect(storedLabels()).toEqual({ [ADDRESS]: "Imported" }));
    expect(await screen.findByText("Imported")).toBeTruthy();
    expect(screen.queryByText("Invalid label format")).toBeNull();
  });

  it("exports the saved labels as a JSON download", () => {
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => "blob:labels");
    const revokeObjectURL = vi.fn();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    const downloads: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      function (this: HTMLAnchorElement) {
        downloads.push(this.download);
      },
    );

    openManager();
    addLabel(ADDRESS, "Export me");
    fireEvent.click(screen.getByRole("button", { name: "Export" }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0][0];
    expect(blob.type).toBe("application/json");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:labels");
    expect(downloads).toEqual(["lumina-address-labels.json"]);
  });

  it("closes from the dialog's close control", () => {
    openManager();
    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes on a backdrop click but not a click inside the panel", () => {
    openManager();
    fireEvent.click(screen.getByRole("heading", { name: "Address Labels" }));
    expect(screen.getByRole("dialog", { name: "Address Labels" })).toBeTruthy();

    fireEvent.click(screen.getByRole("dialog"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
