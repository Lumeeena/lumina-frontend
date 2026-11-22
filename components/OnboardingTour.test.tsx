// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const MESSAGES: Record<string, string> = {
  "onTour.welcomeTitle": "Welcome to Lumina",
  "onTour.welcomeSubtitle": "A quick look around",
  "onTour.closeTour": "Close tour",
  "onTour.skip": "Skip",
  "onTour.next": "Next",
  "onTour.done": "Done",
  "onTour.stepPosition": "Step {current} of {total}",
  "onTour.stepExplorerTitle": "Explorer",
  "onTour.stepExplorerBody": "Look up any account or transaction.",
  "onTour.stepTransactionsTitle": "Transactions",
  "onTour.stepTransactionsBody": "Follow payments as they settle.",
  "onTour.stepEventsTitle": "Events",
  "onTour.stepEventsBody": "Watch contract events live.",
  "onTour.stepGraphqlTitle": "GraphQL",
  "onTour.stepGraphqlBody": "Query the indexer directly.",
  "onTour.stepRegistryTitle": "Registry",
  "onTour.stepRegistryBody": "Find verified contracts.",
};

vi.mock("@/lib/i18n", () => ({
  t: vi.fn((key: string, values?: Record<string, string | number>) =>
    (MESSAGES[key] ?? key).replace(/\{(\w+)\}/g, (_, name: string) =>
      String(values?.[name] ?? ""),
    ),
  ),
}));

import OnboardingTour from "./OnboardingTour";

const STORAGE_KEY = "lumina_onboarding_completed";
const STEP_TITLES = [
  "Explorer",
  "Transactions",
  "Events",
  "GraphQL",
  "Registry",
];

const welcome = () =>
  screen.queryByRole("heading", { name: "Welcome to Lumina" });

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(cleanup);

describe("OnboardingTour", () => {
  describe("first visit", () => {
    it("opens on the first step", () => {
      render(<OnboardingTour />);

      expect(welcome()).toBeInTheDocument();
      expect(screen.getByText("Explorer")).toBeInTheDocument();
      expect(
        screen.getByText("Look up any account or transaction."),
      ).toBeInTheDocument();
      expect(screen.getByText("Step 1 of 5")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Skip" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Close tour" }),
      ).toBeInTheDocument();
    });

    it("does not mark the tour as seen just by showing it", () => {
      render(<OnboardingTour />);
      expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  describe("stepping through", () => {
    it("advances one step per Next and labels the last button Done", async () => {
      const user = userEvent.setup();
      render(<OnboardingTour />);

      for (const [index, title] of STEP_TITLES.entries()) {
        expect(screen.getByText(title)).toBeInTheDocument();
        expect(screen.getByText(`Step ${index + 1} of 5`)).toBeInTheDocument();
        if (index < STEP_TITLES.length - 1) {
          expect(
            screen.queryByRole("button", { name: "Done" }),
          ).not.toBeInTheDocument();
          await user.click(screen.getByRole("button", { name: "Next" }));
        }
      }

      expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Next" }),
      ).not.toBeInTheDocument();
    });
  });

  describe("completion", () => {
    it("closes and remembers completion after the last step", async () => {
      const user = userEvent.setup();
      render(<OnboardingTour />);

      for (let i = 0; i < STEP_TITLES.length - 1; i++) {
        await user.click(screen.getByRole("button", { name: "Next" }));
      }
      expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
      await user.click(screen.getByRole("button", { name: "Done" }));

      expect(welcome()).not.toBeInTheDocument();
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe("true");
    });
  });

  describe("dismissal", () => {
    it.each(["Skip", "Close tour"])(
      "closes and remembers dismissal via %s",
      async (name) => {
        const user = userEvent.setup();
        render(<OnboardingTour />);

        await user.click(screen.getByRole("button", { name: "Next" }));
        await user.click(screen.getByRole("button", { name }));

        expect(welcome()).not.toBeInTheDocument();
        expect(window.localStorage.getItem(STORAGE_KEY)).toBe("true");
      },
    );
  });

  describe("not reappearing", () => {
    it("stays hidden on the next visit after being completed", async () => {
      const user = userEvent.setup();
      const first = render(<OnboardingTour />);
      for (let i = 0; i < STEP_TITLES.length; i++) {
        await user.click(screen.getByRole("button", { name: /^(Next|Done)$/ }));
      }
      first.unmount();

      const { container } = render(<OnboardingTour />);
      expect(container).toBeEmptyDOMElement();
    });

    it("stays hidden on the next visit after being dismissed", async () => {
      const user = userEvent.setup();
      const first = render(<OnboardingTour />);
      await user.click(screen.getByRole("button", { name: "Skip" }));
      first.unmount();

      const { container } = render(<OnboardingTour />);
      expect(container).toBeEmptyDOMElement();
    });

    it("stays hidden when completion was stored earlier", () => {
      window.localStorage.setItem(STORAGE_KEY, "true");
      const { container } = render(<OnboardingTour />);
      expect(container).toBeEmptyDOMElement();
    });
  });
});
