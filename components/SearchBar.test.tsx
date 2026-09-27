// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import SearchBar from "./SearchBar";

const ACCOUNT = "GBWKFFXZ5CJESIHP2EOID5IOXMF472RO5XOJ36X475D5LJGI3AF5R5KY";
const CONTRACT = "CAYUDQPV3RKPM3EXDFGI3457FV677JLUCJ4OLKWGCUBPRIHYKXK3WFAZ";
const HASH = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

beforeEach(() => {
  push.mockClear();
});

afterEach(cleanup);

describe("SearchBar", () => {
  it("carries the attribute the / keyboard shortcut focuses", () => {
    render(<SearchBar />);

    expect(screen.getByLabelText("Search")).toHaveAttribute(
      "data-shortcut-search",
    );
  });

  it("routes an account address to the account page", async () => {
    render(<SearchBar />);
    const input = screen.getByLabelText("Search");

    await userEvent.type(input, ACCOUNT);
    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(push).toHaveBeenCalledWith(`/accounts/${ACCOUNT}`);
  });

  it("routes a contract id to the events page filtered by it", async () => {
    render(<SearchBar />);
    const input = screen.getByLabelText("Search");

    await userEvent.type(input, CONTRACT);
    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(push).toHaveBeenCalledWith(`/events?contractId=${CONTRACT}`);
  });

  it("routes a transaction hash to the transaction page", async () => {
    render(<SearchBar />);
    const input = screen.getByLabelText("Search");

    await userEvent.type(input, HASH);
    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(push).toHaveBeenCalledWith(`/transactions/${HASH}`);
  });

  it("routes anything unrecognised to the memo search", async () => {
    render(<SearchBar />);
    const input = screen.getByLabelText("Search");

    await userEvent.type(input, "order 12345");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(push).toHaveBeenCalledWith("/search?q=order%2012345");
  });

  it("shows what it is reading the input as, live while typing", async () => {
    render(<SearchBar />);
    const input = screen.getByLabelText("Search");

    await userEvent.type(input, ACCOUNT.slice(0, 10));
    expect(screen.getByText("Memo search")).toBeTruthy();

    await userEvent.clear(input);
    await userEvent.type(input, ACCOUNT);
    expect(screen.getByText("Account")).toBeTruthy();
  });

  it("does nothing on an empty submit", async () => {
    render(<SearchBar />);

    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(push).not.toHaveBeenCalled();
  });

  it("submits on Enter as well as on the button", async () => {
    render(<SearchBar />);
    const input = screen.getByLabelText("Search");

    await userEvent.type(input, HASH);
    await userEvent.keyboard("{Enter}");

    expect(push).toHaveBeenCalledWith(`/transactions/${HASH}`);
  });
});
