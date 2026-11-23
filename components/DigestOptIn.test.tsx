// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DigestOptIn from "./DigestOptIn";
import { DIGEST_STORAGE_KEY, type DigestStorage } from "@/lib/digestPreferences";

afterEach(cleanup);

function memoryStorage(seed: Record<string, string> = {}) {
  const data = new Map(Object.entries(seed));
  const storage: DigestStorage & { data: Map<string, string> } = {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
  return storage;
}

const refusingStorage: DigestStorage = {
  getItem: () => null,
  setItem: () => {
    throw new Error("quota exceeded");
  },
};

describe("DigestOptIn", () => {
  it("starts off and asks for no address until a frequency is chosen", () => {
    render(<DigestOptIn storage={memoryStorage()} />);

    expect((screen.getByRole("radio", { name: "Off" }) as HTMLInputElement).checked).toBe(true);
    expect(screen.queryByRole("textbox", { name: "Email address" })).toBeNull();
  });

  it("asks for an address once a frequency is chosen", async () => {
    const user = userEvent.setup();
    render(<DigestOptIn storage={memoryStorage()} />);

    await user.click(screen.getByRole("radio", { name: "Daily" }));

    expect(screen.getByRole("textbox", { name: "Email address" })).toBeTruthy();
  });

  it("refuses to save a frequency without a usable address and stores nothing", async () => {
    const user = userEvent.setup();
    const storage = memoryStorage();
    render(<DigestOptIn storage={storage} />);

    await user.click(screen.getByRole("radio", { name: "Daily" }));
    await user.click(screen.getByRole("button", { name: "Save digest settings" }));

    expect(screen.getByRole("alert").textContent).toContain(
      "Enter an email address to receive digests.",
    );
    expect(storage.data.has(DIGEST_STORAGE_KEY)).toBe(false);
  });

  it("saves a valid preference and says plainly that no digest is sent yet", async () => {
    const user = userEvent.setup();
    const storage = memoryStorage();
    render(<DigestOptIn storage={storage} />);

    await user.click(screen.getByRole("radio", { name: "Weekly" }));
    await user.type(
      screen.getByRole("textbox", { name: "Email address" }),
      "ada@example.com",
    );
    await user.click(screen.getByRole("button", { name: "Save digest settings" }));

    expect(JSON.parse(storage.data.get(DIGEST_STORAGE_KEY) ?? "null")).toEqual({
      frequency: "weekly",
      email: "ada@example.com",
    });
    expect(screen.getByRole("status").textContent).toContain(
      "No weekly digest is sent yet",
    );
  });

  it("drops the address when digests are turned off", async () => {
    const user = userEvent.setup();
    const storage = memoryStorage({
      [DIGEST_STORAGE_KEY]: JSON.stringify({
        frequency: "daily",
        email: "ada@example.com",
      }),
    });
    render(<DigestOptIn storage={storage} />);

    await user.click(screen.getByRole("radio", { name: "Off" }));
    await user.click(screen.getByRole("button", { name: "Save digest settings" }));

    expect(JSON.parse(storage.data.get(DIGEST_STORAGE_KEY) ?? "null")).toEqual({
      frequency: "off",
      email: null,
    });
    expect(screen.getByRole("status").textContent).toContain("No address is kept.");
  });

  it("shows the preference already saved in this browser when it loads", () => {
    const storage = memoryStorage({
      [DIGEST_STORAGE_KEY]: JSON.stringify({
        frequency: "weekly",
        email: "ada@example.com",
      }),
    });
    render(<DigestOptIn storage={storage} />);

    expect((screen.getByRole("radio", { name: "Weekly" }) as HTMLInputElement).checked).toBe(
      true,
    );
    expect(
      (screen.getByRole("textbox", { name: "Email address" }) as HTMLInputElement).value,
    ).toBe("ada@example.com");
    expect(screen.getByText("Currently weekly to the address saved in this browser.")).toBeTruthy();
  });

  it("reports a save the browser refuses instead of claiming it worked", async () => {
    const user = userEvent.setup();
    render(<DigestOptIn storage={refusingStorage} />);

    await user.click(screen.getByRole("radio", { name: "Daily" }));
    await user.type(
      screen.getByRole("textbox", { name: "Email address" }),
      "ada@example.com",
    );
    await user.click(screen.getByRole("button", { name: "Save digest settings" }));

    expect(screen.getByRole("alert").textContent).toContain("would not store the preference");
    expect(screen.queryByRole("status")).toBeNull();
  });
});
