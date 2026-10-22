// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { wcagViolations } from "@/lib/axeScan";
import { VerifiedBadge, StakeBadge, LifetimeSlashedBadge } from "./RegistryBadges";

afterEach(cleanup);

describe("RegistryBadges accessibility", () => {
  it("VerifiedBadge passes automated accessibility scan", async () => {
    const { container } = render(<VerifiedBadge />);
    const violations = await wcagViolations(container);
    expect(violations).toEqual([]);
  });

  it("StakeBadge with positive stake passes automated accessibility scan", async () => {
    const { container } = render(<StakeBadge stake={BigInt(1000000000)} />);
    const violations = await wcagViolations(container);
    expect(violations).toEqual([]);
  });

  it("StakeBadge with zero stake renders nothing and passes scan", async () => {
    const { container } = render(<StakeBadge stake={BigInt(0)} />);
    const violations = await wcagViolations(container);
    expect(violations).toEqual([]);
  });

  it("LifetimeSlashedBadge with positive amount passes automated accessibility scan", async () => {
    const { container } = render(<LifetimeSlashedBadge slashedTotal={BigInt(500000000)} />);
    const violations = await wcagViolations(container);
    expect(violations).toEqual([]);
  });

  it("LifetimeSlashedBadge with zero amount renders nothing and passes scan", async () => {
    const { container } = render(<LifetimeSlashedBadge slashedTotal={BigInt(0)} />);
    const violations = await wcagViolations(container);
    expect(violations).toEqual([]);
  });

  it("all badges together pass automated accessibility scan", async () => {
    const { container } = render(
      <div>
        <VerifiedBadge />
        <StakeBadge stake={BigInt(1000000000)} />
        <LifetimeSlashedBadge slashedTotal={BigInt(500000000)} />
      </div>
    );
    const violations = await wcagViolations(container);
    expect(violations).toEqual([]);
  });

  it("VerifiedBadge icon has proper ARIA label", () => {
    const { container } = render(<VerifiedBadge />);
    const icon = container.querySelector('svg[role="img"]');
    expect(icon).toHaveAttribute("aria-label", "Attested by registry governance");
  });

  it("StakeBadge icon is properly hidden from screen readers", () => {
    const { container } = render(<StakeBadge stake={BigInt(1000000000)} />);
    const icon = container.querySelector('svg[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });

  it("LifetimeSlashedBadge icon is properly hidden from screen readers", () => {
    const { container } = render(<LifetimeSlashedBadge slashedTotal={BigInt(500000000)} />);
    const icon = container.querySelector('svg[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });
});
