// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import ContractLink from "./ContractLink";

afterEach(cleanup);

describe("ContractLink accessibility", () => {
  it("provides a full accessible name and keyboard focus", async () => {
    const contractId = "CAYUDQPV3RKPM3EXDFGI3457FV677JLUCJ4OLKWGCUBPRIHYKXK3WFAZ";
    render(<ContractLink contractId={contractId} truncate={6} />);

    const link = screen.getByRole("link", { name: `Contract ${contractId}` });
    expect(link).toHaveAttribute("href", `/contracts/${contractId}`);
    await userEvent.tab();
    expect(document.activeElement).toBe(link);
  });
});
