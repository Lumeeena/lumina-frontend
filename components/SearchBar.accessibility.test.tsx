// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import SearchBar from "./SearchBar";

const ACCOUNT = "GBWKFFXZ5CJESIHP2EOID5IOXMF472RO5XOJ36X475D5LJGI3AF5R5KY";

beforeEach(() => {
  push.mockClear();
});

afterEach(cleanup);

describe("SearchBar accessibility", () => {
  it("has accessible name on search input and keyboard-operable controls", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    
    const input = screen.getByLabelText("Search");
    expect(input).toHaveAttribute("aria-label", "Search");
    
    const button = screen.getByRole("button", { name: "Search" });
    expect(button).toHaveAttribute("type", "submit");
    
    await user.tab();
    expect(input).toHaveFocus();
    
    await user.type(input, ACCOUNT);
    await user.tab();
    expect(button).toHaveFocus();
    
    expect(input.className).toContain("focus:border-[var(--color-border-strong)]");
  });

  it("classification hint is properly hidden from assistive tech", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    
    const input = screen.getByLabelText("Search");
    await user.type(input, ACCOUNT);
    
    const hint = screen.getByText("Account");
    expect(hint).toHaveAttribute("aria-hidden", "true");
  });

  it("supports keyboard submission with Enter", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    
    const input = screen.getByLabelText("Search");
    await user.type(input, ACCOUNT);
    await user.keyboard("{Enter}");
    
    expect(push).toHaveBeenCalledWith(`/accounts/${ACCOUNT}`);
  });

  it("uses semantic HTML form element", () => {
    const { container } = render(<SearchBar />);
    const form = container.querySelector("form");
    expect(form).toBeTruthy();
  });
});
