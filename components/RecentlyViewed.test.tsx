// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RecentlyViewed from "./RecentlyViewed";
import {
  RECENTLY_VIEWED_KEY,
  addRecentlyViewed,
  readRecentlyViewed,
  type EntityType,
} from "@/lib/recentlyViewed";

/** Views entries in order, so the last one is the most recent. */
function view(
  ...entries: Array<[id: string, type: EntityType, label: string]>
) {
  for (const [id, type, label] of entries) {
    addRecentlyViewed(id, type, label, `/${type}/${id}`);
  }
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(cleanup);

describe("RecentlyViewed", () => {
  describe("empty history", () => {
    it("renders nothing when nothing has been viewed", () => {
      const { container } = render(<RecentlyViewed />);
      expect(container).toBeEmptyDOMElement();
      expect(
        screen.queryByRole("heading", { name: /recently viewed/i }),
      ).not.toBeInTheDocument();
    });

    it("renders nothing when stored history is unreadable", () => {
      window.localStorage.setItem(RECENTLY_VIEWED_KEY, "{not json");
      const { container } = render(<RecentlyViewed />);
      expect(container).toBeEmptyDOMElement();
    });

    it("renders nothing in compact mode either", () => {
      const { container } = render(<RecentlyViewed compact />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("ordering", () => {
    it("lists the most recently viewed entity first", () => {
      view(
        ["GA", "account", "Alice"],
        ["tx1", "transaction", "Payment"],
        ["CC", "contract", "Token"],
      );
      render(<RecentlyViewed />);

      expect(
        screen.getByRole("heading", { name: /recently viewed/i }),
      ).toBeInTheDocument();
      const links = screen.getAllByRole("link");
      expect(links.map((l) => l.getAttribute("href"))).toEqual([
        "/contract/CC",
        "/transaction/tx1",
        "/account/GA",
      ]);
      expect(within(links[0]).getByText("Token")).toBeInTheDocument();
      expect(within(links[0]).getByText("contract")).toBeInTheDocument();
    });

    it("moves a re-viewed entity back to the top without duplicating it", () => {
      view(
        ["GA", "account", "Alice"],
        ["GB", "account", "Bob"],
        ["GA", "account", "Alice"],
      );
      render(<RecentlyViewed />);

      expect(
        screen.getAllByRole("link").map((l) => l.getAttribute("href")),
      ).toEqual(["/account/GA", "/account/GB"]);
    });

    it("treats the same id under different types as separate entries", () => {
      view(["X1", "account", "As account"], ["X1", "contract", "As contract"]);
      render(<RecentlyViewed />);

      expect(screen.getByRole("link", { name: /as account/i })).toHaveAttribute(
        "href",
        "/account/X1",
      );
      expect(
        screen.getByRole("link", { name: /as contract/i }),
      ).toHaveAttribute("href", "/contract/X1");
    });
  });

  describe("maximum length", () => {
    beforeEach(() => {
      view(
        ...Array.from(
          { length: 7 },
          (_, i) =>
            [`G${i}`, "account", `Account ${i}`] as [
              string,
              EntityType,
              string,
            ],
        ),
      );
    });

    it("shows at most 5 entries by default, newest first", () => {
      render(<RecentlyViewed />);
      const links = screen.getAllByRole("link");
      expect(links).toHaveLength(5);
      expect(links[0]).toHaveAccessibleName(/account 6/i);
      expect(links[4]).toHaveAccessibleName(/account 2/i);
      expect(
        screen.queryByRole("link", { name: /account 1\b/i }),
      ).not.toBeInTheDocument();
    });

    it("honours a custom limit", () => {
      render(<RecentlyViewed limit={2} />);
      expect(screen.getAllByRole("link")).toHaveLength(2);
    });

    it("shows everything when the limit exceeds the history", () => {
      render(<RecentlyViewed limit={20} />);
      expect(screen.getAllByRole("link")).toHaveLength(7);
    });

    it("applies the limit in compact mode", () => {
      render(<RecentlyViewed compact limit={3} />);
      expect(screen.getAllByRole("link")).toHaveLength(3);
    });
  });

  describe("compact mode", () => {
    it("lists plain links without clear or remove controls", () => {
      view(["GA", "account", "Alice"]);
      render(<RecentlyViewed compact />);

      expect(
        screen.getByRole("heading", { name: /recently viewed/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Alice" })).toHaveAttribute(
        "href",
        "/account/GA",
      );
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("removing entries", () => {
    it("removes one entry from the list and from storage", async () => {
      const user = userEvent.setup();
      view(["GA", "account", "Alice"], ["GB", "account", "Bob"]);
      render(<RecentlyViewed />);

      const bob = screen.getByRole("link", { name: /bob/i });
      await user.click(
        within(bob).getByRole("button", {
          name: /remove from recently viewed/i,
        }),
      );

      expect(
        screen.queryByRole("link", { name: /bob/i }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: /alice/i })).toBeInTheDocument();
      expect(readRecentlyViewed().map((e) => e.id)).toEqual(["GA"]);
    });

    it("hides the section once the last entry is removed", async () => {
      const user = userEvent.setup();
      view(["GA", "account", "Alice"]);
      const { container } = render(<RecentlyViewed />);

      await user.click(
        screen.getByRole("button", { name: /remove from recently viewed/i }),
      );

      expect(container).toBeEmptyDOMElement();
    });

    it("clears the whole history", async () => {
      const user = userEvent.setup();
      view(["GA", "account", "Alice"], ["GB", "account", "Bob"]);
      const { container } = render(<RecentlyViewed />);

      await user.click(screen.getByRole("button", { name: "Clear" }));

      expect(container).toBeEmptyDOMElement();
      expect(readRecentlyViewed()).toEqual([]);
    });
  });
});
