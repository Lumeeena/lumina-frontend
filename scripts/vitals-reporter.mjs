import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import {
  compareVitals,
  formatVitals,
  METRICS,
  percentile75,
} from "./vitals-report.mjs";

export default class VitalsReporter {
  measurements = {};
  failures = [];

  onTestEnd(test, result) {
    if (result.status !== "passed" && result.status !== "skipped")
      this.failures.push(test.title);
    for (const attachment of result.attachments.filter(
      (item) => item.name === "web-vitals",
    )) {
      const { route, samples } = JSON.parse(
        attachment.body?.toString() ?? readFileSync(attachment.path, "utf8"),
      );
      this.measurements[route] = samples;
    }
  }

  onEnd() {
    if (process.argv.includes("--list")) return { status: "passed" };
    mkdirSync("test-results/vitals", { recursive: true });
    const budgetPath = "vitals-budget.json";
    try {
      if (this.failures.length || !Object.keys(this.measurements).length)
        throw new Error(
          `Incomplete vitals run: ${this.failures.join(", ") || "no measurements"}`,
        );
      if (process.env.VITALS_REFERENCE_RUN === "1") {
        writeFileSync(
          "vitals-reference.json",
          JSON.stringify({ samples: this.measurements }, null, 2),
        );
        return { status: "passed" };
      }
      if (process.env.UPDATE_VITALS === "1") {
        if (process.env.CI)
          throw new Error(
            "Budgets must be reviewed and committed; CI cannot update them",
          );
        const routes = Object.fromEntries(
          Object.entries(this.measurements).map(([route, samples]) => {
            const baseline = Object.fromEntries(
              METRICS.map((name) => [
                name,
                percentile75(samples.map((sample) => sample[name])),
              ]),
            );
            return [
              route,
              {
                baseline,
                budget: {
                  LCP: Math.ceil(Math.max(2500, baseline.LCP * 1.25 + 200)),
                  CLS: Math.max(0.1, baseline.CLS + 0.02),
                  INP: Math.ceil(Math.max(200, baseline.INP * 1.25 + 50)),
                },
              },
            ];
          }),
        );
        writeFileSync(
          budgetPath,
          `${JSON.stringify({ scenario: "Desktop Chromium, three cold contexts per route, fixed local GraphQL fixtures, disconnected wallet and unavailable registry RPC", routes }, null, 2)}\n`,
        );
      }
      if (!existsSync(budgetPath))
        throw new Error(
          "Missing vitals-budget.json; run npm run vitals:update",
        );
      const budget = JSON.parse(readFileSync(budgetPath, "utf8"));
      const missing = Object.keys(budget.routes).filter(
        (route) => !this.measurements[route],
      );
      if (missing.length)
        throw new Error(`Missing route measurements: ${missing.join(", ")}`);
      const reference = existsSync("vitals-reference.json")
        ? JSON.parse(readFileSync("vitals-reference.json", "utf8")).samples
        : {};
      const rows = compareVitals(this.measurements, budget, reference);
      const referenceNote = Object.keys(reference).length
        ? "Reference: the PR base revision measured with the same browser journeys."
        : "PR base measurement unavailable; deltas use committed measured baselines where present. Unmeasured baselines are explicitly unavailable. Budgets still gate every route.";
      const markdown = `## Core Web Vitals\n\n${budget.scenario}\n\n${referenceNote}\n\n${formatVitals(rows)}\n`;
      writeFileSync(
        "test-results/vitals/report.json",
        JSON.stringify(
          { scenario: budget.scenario, samples: this.measurements, rows },
          null,
          2,
        ),
      );
      writeFileSync("test-results/vitals/report.md", markdown);
      if (process.env.GITHUB_STEP_SUMMARY)
        appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
      console.log(markdown);
      const over = rows.flatMap((row) =>
        METRICS.filter((name) => !row.metrics[name].passed).map(
          (name) =>
            `${row.route} ${name}: ${row.metrics[name].value} > ${row.metrics[name].limit}`,
        ),
      );
      for (const message of over)
        console.error(
          process.env.GITHUB_ACTIONS
            ? `::error title=Core Web Vitals regression::${message}`
            : message,
        );
      return { status: over.length ? "failed" : "passed" };
    } catch (error) {
      if (process.env.VITALS_REFERENCE_RUN === "1")
        writeFileSync("vitals-reference-error.txt", String(error));
      writeFileSync("test-results/vitals/error.txt", String(error));
      if (process.env.GITHUB_STEP_SUMMARY)
        appendFileSync(
          process.env.GITHUB_STEP_SUMMARY,
          `## Core Web Vitals\n\nMeasurement failed: ${String(error)}\n`,
        );
      console.error(error);
      return { status: "failed" };
    }
  }
}
