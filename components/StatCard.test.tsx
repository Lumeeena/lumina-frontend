// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import StatCard from "./StatCard";

afterEach(cleanup);

describe("StatCard", () => {
  it("renders the value and title", () => {
    render(<StatCard title="Latest Ledger" value={1234} />);
    expect(screen.getByText("1234")).toBeTruthy();
    expect(screen.getByText("Latest Ledger")).toBeTruthy();
  });

  it("renders a string value unchanged", () => {
    // Values arrive pre-formatted; the card must not re-interpret them.
    render(<StatCard title="Supply" value="1,234,567.8901234" />);
    expect(screen.getByText("1,234,567.8901234")).toBeTruthy();
  });

  it("omits the subtitle and icon when not supplied", () => {
    const { container } = render(<StatCard title="Ops" value={0} />);
    expect(screen.queryByTestId("stat-icon")).toBeNull();
    expect(container.textContent).toBe("0Ops");
  });

  it("renders the subtitle and icon when supplied", () => {
    render(
      <StatCard title="Ops" value={5} subtitle="last 200" icon={<span data-testid="stat-icon">*</span>} />
    );
    expect(screen.getByText("last 200")).toBeTruthy();
    expect(screen.getByTestId("stat-icon")).toBeTruthy();
  });

  it("renders zero rather than treating it as absent", () => {
    render(<StatCard title="Failed" value={0} />);
    expect(screen.getByText("0")).toBeTruthy();
  });
});
