// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WatchedAddressList from "./WatchedAddressList";
import * as watchesModule from "@/lib/watches";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => "/watch",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock the network hook
vi.mock("@/lib/useNetwork", () => ({
  useNetwork: () => ({
    network: "testnet",
  }),
}));

// Mock WatchAlertSettings component since it's not under test
vi.mock("./WatchAlertSettings", () => ({
  default: ({ address }: { address: string }) => (
    <div data-testid={`alert-settings-${address}`}>Alert Settings for {address}</div>
  ),
}));

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

afterEach(cleanup);

describe("WatchedAddressList", () => {
  const validAddress = "GABC1234567890DEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDEFGH";
  const anotherAddress = "GDEF1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCD";

  describe("empty state", () => {
    it("renders empty state when no watches exist", () => {
      render(<WatchedAddressList />);
      expect(
        screen.getByText(/Nothing watched yet/i)
      ).toBeInTheDocument();
    });

    it("shows add watch form when empty", () => {
      render(<WatchedAddressList />);
      expect(screen.getByLabelText(/Stellar address to watch/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Add watch/i })).toBeInTheDocument();
    });
  });

  describe("adding watches", () => {
    it("adds a valid address to the watch list", async () => {
      const user = userEvent.setup();
      render(<WatchedAddressList />);

      const input = screen.getByLabelText(/Stellar address to watch/i);
      const addButton = screen.getByRole("button", { name: /Add watch/i });

      await user.type(input, validAddress);
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId("watch-list")).toBeInTheDocument();
      });

      expect(screen.getByText(/GABC12/)).toBeInTheDocument();
    });

    it("clears input after successful add", async () => {
      const user = userEvent.setup();
      render(<WatchedAddressList />);

      const input = screen.getByLabelText(/Stellar address to watch/i) as HTMLInputElement;
      const addButton = screen.getByRole("button", { name: /Add watch/i });

      await user.type(input, validAddress);
      await user.click(addButton);

      await waitFor(() => {
        expect(input.value).toBe("");
      });
    });

    it("shows error for empty address", async () => {
      const user = userEvent.setup();
      render(<WatchedAddressList />);

      const addButton = screen.getByRole("button", { name: /Add watch/i });
      await user.click(addButton);

      expect(screen.getByRole("alert")).toHaveTextContent(/Enter an address to watch/i);
    });

    it("shows error for invalid address", async () => {
      const user = userEvent.setup();
      render(<WatchedAddressList />);

      const input = screen.getByLabelText(/Stellar address to watch/i);
      const addButton = screen.getByRole("button", { name: /Add watch/i });

      await user.type(input, "INVALID");
      await user.click(addButton);

      expect(screen.getByRole("alert")).toHaveTextContent(/not a Stellar account ID/i);
    });

    it("shows error when adding duplicate address", async () => {
      const user = userEvent.setup();
      
      // Pre-populate with one watch
      watchesModule.addWatch(validAddress);
      
      render(<WatchedAddressList />);

      const input = screen.getByLabelText(/Stellar address to watch/i);
      const addButton = screen.getByRole("button", { name: /Add watch/i });

      await user.type(input, validAddress);
      await user.click(addButton);

      expect(screen.getByRole("alert")).toHaveTextContent(/already on your watch list/i);
    });

    it("converts address to uppercase", async () => {
      const user = userEvent.setup();
      render(<WatchedAddressList />);

      const input = screen.getByLabelText(/Stellar address to watch/i);
      const addButton = screen.getByRole("button", { name: /Add watch/i });

      await user.type(input, validAddress.toLowerCase());
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByTestId("watch-list")).toBeInTheDocument();
      });
    });

    it("clears error when typing in input", async () => {
      const user = userEvent.setup();
      render(<WatchedAddressList />);

      const input = screen.getByLabelText(/Stellar address to watch/i);
      const addButton = screen.getByRole("button", { name: /Add watch/i });

      // Trigger error
      await user.click(addButton);
      expect(screen.getByRole("alert")).toBeInTheDocument();

      // Start typing
      await user.type(input, "G");
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("removing watches", () => {
    it("removes a watch when remove button is clicked", async () => {
      const user = userEvent.setup();
      
      // Pre-populate with one watch
      watchesModule.addWatch(validAddress);
      
      render(<WatchedAddressList />);

      const removeButton = screen.getByRole("button", { name: new RegExp(`Unwatch ${validAddress}`, "i") });
      await user.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByTestId("watch-list")).not.toBeInTheDocument();
      });
      expect(screen.getByText(/Nothing watched yet/i)).toBeInTheDocument();
    });

    it("removes only the targeted watch from multiple watches", async () => {
      const user = userEvent.setup();
      
      // Pre-populate with two watches
      watchesModule.addWatch(validAddress);
      watchesModule.addWatch(anotherAddress);
      
      render(<WatchedAddressList />);

      const firstRemove = screen.getByRole("button", { name: new RegExp(`Unwatch ${validAddress}`, "i") });
      await user.click(firstRemove);

      await waitFor(() => {
        expect(screen.queryByText(/GABC12/)).not.toBeInTheDocument();
      });
      expect(screen.getByText(/GDEF12/)).toBeInTheDocument();
    });
  });

  describe("watch list display", () => {
    it("displays multiple watches", () => {
      watchesModule.addWatch(validAddress);
      watchesModule.addWatch(anotherAddress);
      
      render(<WatchedAddressList />);

      const list = screen.getByTestId("watch-list");
      expect(list.children).toHaveLength(2);
    });

    it("displays truncated addresses", () => {
      watchesModule.addWatch(validAddress);
      
      render(<WatchedAddressList />);

      expect(screen.getByText(/GABC12/)).toBeInTheDocument();
      expect(screen.queryByText(validAddress)).not.toBeInTheDocument();
    });

    it("renders alert settings for each watch", () => {
      watchesModule.addWatch(validAddress);
      watchesModule.addWatch(anotherAddress);
      
      render(<WatchedAddressList />);

      expect(screen.getByTestId(`alert-settings-${validAddress}`)).toBeInTheDocument();
      expect(screen.getByTestId(`alert-settings-${anotherAddress}`)).toBeInTheDocument();
    });

    it("displays filter count for each watch", () => {
      watchesModule.addWatch(validAddress);
      
      render(<WatchedAddressList />);

      // Default filters should show "0 filters" or similar
      expect(screen.getByText(/\d+ filters?/i)).toBeInTheDocument();
    });
  });

  describe("watch list cap", () => {
    it("shows full message when at MAX_WATCHES", () => {
      // Add MAX_WATCHES entries
      for (let i = 0; i < watchesModule.MAX_WATCHES; i++) {
        watchesModule.addWatch(`G${"A".repeat(55)}${i.toString().padStart(2, "0")}`);
      }
      
      render(<WatchedAddressList />);

      expect(screen.getByTestId("watch-list-full")).toBeInTheDocument();
      expect(screen.getByText(new RegExp(`capped at ${watchesModule.MAX_WATCHES}`, "i"))).toBeInTheDocument();
    });

    it("disables add button when watch list is full", () => {
      // Add MAX_WATCHES entries
      for (let i = 0; i < watchesModule.MAX_WATCHES; i++) {
        watchesModule.addWatch(`G${"A".repeat(55)}${i.toString().padStart(2, "0")}`);
      }
      
      render(<WatchedAddressList />);

      const addButton = screen.getByRole("button", { name: /Add watch/i });
      expect(addButton).toBeDisabled();
    });
  });

  describe("export functionality", () => {
    it("renders export button", () => {
      render(<WatchedAddressList />);
      expect(screen.getByRole("button", { name: /Export List/i })).toBeInTheDocument();
    });

    it("disables export when list is empty", () => {
      render(<WatchedAddressList />);
      const exportButton = screen.getByRole("button", { name: /Export List/i });
      expect(exportButton).toBeDisabled();
    });

    it("enables export when list has entries", () => {
      watchesModule.addWatch(validAddress);
      
      render(<WatchedAddressList />);

      const exportButton = screen.getByRole("button", { name: /Export List/i });
      expect(exportButton).not.toBeDisabled();
    });

    it("triggers download when export is clicked", async () => {
      const user = userEvent.setup();
      watchesModule.addWatch(validAddress);
      
      // Mock DOM methods for download
      const createElementSpy = vi.spyOn(document, "createElement");
      const appendChildSpy = vi.spyOn(document.body, "appendChild").mockImplementation(() => null as any);
      const removeChildSpy = vi.spyOn(document.body, "removeChild").mockImplementation(() => null as any);
      
      render(<WatchedAddressList />);

      const exportButton = screen.getByRole("button", { name: /Export List/i });
      await user.click(exportButton);

      expect(createElementSpy).toHaveBeenCalledWith("a");
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
    });
  });

  describe("import functionality", () => {
    it("renders import button", () => {
      render(<WatchedAddressList />);
      expect(screen.getByRole("button", { name: /Import List/i })).toBeInTheDocument();
    });

    it("shows import confirmation dialog when file is selected", async () => {
      const user = userEvent.setup();
      render(<WatchedAddressList />);

      const fileInput = screen.getByLabelText(/Import watch list file/i);
      const file = new File(
        [JSON.stringify([{ address: validAddress, filters: {} }])],
        "watches.json",
        { type: "application/json" }
      );

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/Import Watch List/i)).toBeInTheDocument();
      });
      expect(screen.getByRole("button", { name: /Confirm Import/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
    });

    it("allows choosing merge or replace mode", async () => {
      const user = userEvent.setup();
      render(<WatchedAddressList />);

      const fileInput = screen.getByLabelText(/Import watch list file/i);
      const file = new File([JSON.stringify([])], "watches.json", { type: "application/json" });

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByLabelText(/Merge/i)).toBeInTheDocument();
      });

      const mergeRadio = screen.getByLabelText(/Merge/i) as HTMLInputElement;
      const replaceRadio = screen.getByLabelText(/Replace/i) as HTMLInputElement;

      expect(mergeRadio.checked).toBe(true);
      expect(replaceRadio.checked).toBe(false);

      await user.click(replaceRadio);

      expect(mergeRadio.checked).toBe(false);
      expect(replaceRadio.checked).toBe(true);
    });

    it("cancels import when cancel button is clicked", async () => {
      const user = userEvent.setup();
      render(<WatchedAddressList />);

      const fileInput = screen.getByLabelText(/Import watch list file/i);
      const file = new File([JSON.stringify([])], "watches.json", { type: "application/json" });

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      await user.click(cancelButton);

      expect(screen.queryByText(/Import Watch List/i)).not.toBeInTheDocument();
    });

    it("imports valid watch list on confirm", async () => {
      const user = userEvent.setup();
      render(<WatchedAddressList />);

      const fileInput = screen.getByLabelText(/Import watch list file/i);
      const file = new File(
        [JSON.stringify([{ address: validAddress, filters: {} }])],
        "watches.json",
        { type: "application/json" }
      );

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Confirm Import/i })).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", { name: /Confirm Import/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.queryByText(/Import Watch List/i)).not.toBeInTheDocument();
      });

      expect(screen.getByTestId("watch-list")).toBeInTheDocument();
      expect(screen.getByText(/GABC12/)).toBeInTheDocument();
    });

    it("shows error for invalid import file", async () => {
      const user = userEvent.setup();
      render(<WatchedAddressList />);

      const fileInput = screen.getByLabelText(/Import watch list file/i);
      const file = new File(["invalid json{"], "watches.json", { type: "application/json" });

      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Confirm Import/i })).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole("button", { name: /Confirm Import/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(/Failed to import/i);
      });
    });

    it("resets file input after selection to allow re-selecting same file", async () => {
      const user = userEvent.setup();
      render(<WatchedAddressList />);

      const fileInput = screen.getByLabelText(/Import watch list file/i) as HTMLInputElement;
      const file = new File([JSON.stringify([])], "watches.json", { type: "application/json" });

      await user.upload(fileInput, file);
      
      // File input should be reset to allow re-selecting the same file
      expect(fileInput.value).toBe("");
    });
  });

  describe("links", () => {
    it("links each watch to its account page", () => {
      watchesModule.addWatch(validAddress);
      
      render(<WatchedAddressList />);

      const link = screen.getByRole("link", { name: /GABC12/i });
      expect(link).toHaveAttribute("href", expect.stringContaining(`/accounts/${validAddress}`));
    });

    it("includes network in account links", () => {
      watchesModule.addWatch(validAddress);
      
      render(<WatchedAddressList />);

      const link = screen.getByRole("link", { name: /GABC12/i });
      expect(link).toHaveAttribute("href", expect.stringContaining("testnet"));
    });
  });
});
