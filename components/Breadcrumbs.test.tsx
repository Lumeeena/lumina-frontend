// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Breadcrumbs from "./Breadcrumbs";

afterEach(cleanup);

describe("Breadcrumbs accessibility", () => {
  it("marks the current page and keeps links keyboard operable", async () => {
    render(
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Contracts" }]}
      />,
    );

    const link = screen.getByRole("link", { name: "Home" });
    expect(link).toHaveAttribute("href", "/");
    expect(screen.getByText("Contracts")).toHaveAttribute("aria-current", "page");

    await userEvent.tab();
    expect(document.activeElement).toBe(link);
  });
});
