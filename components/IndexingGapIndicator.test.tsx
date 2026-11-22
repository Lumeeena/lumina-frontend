// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import IndexingGapIndicator from "./IndexingGapIndicator";

afterEach(cleanup);

const heading = () =>
  screen.queryByRole("heading", { name: /incomplete indexing/i });
const gapLines = () => screen.queryAllByText(/^Gap: ledgers/);
const gapText = (start: number, end: number) =>
  `Gap: ledgers ${start.toLocaleString()} to ${end.toLocaleString()}`;

describe("IndexingGapIndicator", () => {
  describe("no gaps", () => {
    it.each([
      ["undefined", undefined],
      ["null", null],
      ["an empty list", []],
    ])("renders nothing when gaps is %s", (_label, gaps) => {
      const { container } = render(<IndexingGapIndicator gaps={gaps} />);
      expect(container).toBeEmptyDOMElement();
    });

    it("renders nothing when every gap is outside the viewed range", () => {
      const { container } = render(
        <IndexingGapIndicator
          gaps={[
            { startLedger: 10, endLedger: 19 },
            { startLedger: 81, endLedger: 90 },
          ]}
          viewedLedgerStart={20}
          viewedLedgerEnd={80}
        />,
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("a single gap", () => {
    it("shows the warning and the gap's ledger range", () => {
      render(
        <IndexingGapIndicator gaps={[{ startLedger: 100, endLedger: 250 }]} />,
      );

      expect(heading()).toBeInTheDocument();
      expect(
        screen.getByText(/includes gaps in indexing/i),
      ).toBeInTheDocument();
      expect(gapLines()).toHaveLength(1);
      expect(screen.getByText(gapText(100, 250))).toBeInTheDocument();
    });

    it("formats large ledger numbers with locale separators", () => {
      render(
        <IndexingGapIndicator
          gaps={[{ startLedger: 52_000_000, endLedger: 52_001_234 }]}
        />,
      );
      expect(
        screen.getByText(gapText(52_000_000, 52_001_234)),
      ).toBeInTheDocument();
    });

    it.each([
      [
        "ends exactly where the view starts",
        { startLedger: 10, endLedger: 20 },
      ],
      [
        "starts exactly where the view ends",
        { startLedger: 80, endLedger: 90 },
      ],
      ["lies inside the view", { startLedger: 40, endLedger: 50 }],
      ["covers the whole view", { startLedger: 1, endLedger: 1_000 }],
    ])("is shown when it %s", (_label, gap) => {
      render(
        <IndexingGapIndicator
          gaps={[gap]}
          viewedLedgerStart={20}
          viewedLedgerEnd={80}
        />,
      );
      expect(
        screen.getByText(gapText(gap.startLedger, gap.endLedger)),
      ).toBeInTheDocument();
    });
  });

  describe("several gaps", () => {
    const gaps = [
      { startLedger: 5, endLedger: 9 },
      { startLedger: 30, endLedger: 35 },
      { startLedger: 70, endLedger: 85 },
      { startLedger: 200, endLedger: 210 },
    ];

    it("lists every gap in the order given when no range is viewed", () => {
      render(<IndexingGapIndicator gaps={gaps} />);

      expect(heading()).toBeInTheDocument();
      expect(gapLines().map((line) => line.textContent)).toEqual(
        gaps.map((g) => gapText(g.startLedger, g.endLedger)),
      );
    });

    it("lists only the gaps that overlap the viewed range", () => {
      render(
        <IndexingGapIndicator
          gaps={gaps}
          viewedLedgerStart={20}
          viewedLedgerEnd={80}
        />,
      );

      expect(gapLines().map((line) => line.textContent)).toEqual([
        gapText(30, 35),
        gapText(70, 85),
      ]);
    });

    it("ignores a half-specified range and lists every gap", () => {
      render(<IndexingGapIndicator gaps={gaps} viewedLedgerStart={20} />);
      expect(gapLines()).toHaveLength(gaps.length);
    });
  });
});
