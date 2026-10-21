export const METRICS = ["LCP", "CLS", "INP"];

export function percentile75(values) {
  if (
    !values.length ||
    values.some((value) => !Number.isFinite(value) || value < 0)
  )
    throw new Error("Missing or invalid vitals sample");
  return [...values].sort((a, b) => a - b)[Math.ceil(values.length * 0.75) - 1];
}

export function compareVitals(measurements, budget, reference = {}) {
  return Object.entries(measurements).map(([route, samples]) => {
    const accepted = budget.routes[route];
    if (!accepted)
      throw new Error(
        `No vitals budget for ${route}; measure and review a baseline`,
      );
    return {
      route,
      metrics: Object.fromEntries(
        METRICS.map((name) => {
          const value = percentile75(samples.map((sample) => sample[name]));
          const baseline = reference[route]
            ? percentile75(reference[route].map((sample) => sample[name]))
            : accepted.baseline[name];
          const limit = accepted.budget[name];
          if (
            (baseline !== null && !Number.isFinite(baseline)) ||
            !Number.isFinite(limit) ||
            limit < 0
          )
            throw new Error(`Invalid ${name} budget for ${route}`);
          return [
            name,
            {
              value,
              baseline,
              delta: baseline === null ? null : value - baseline,
              limit,
              passed: value <= limit,
            },
          ];
        }),
      ),
    };
  });
}

export function formatVitals(rows) {
  const format = (name, value) =>
    value === null
      ? "Unavailable"
      : name === "CLS"
        ? value.toFixed(4)
        : `${value.toFixed(0)} ms`;
  return [
    "| Route | Metric | p75 | Reference p75 | Delta | Budget | Result |",
    "| --- | --- | ---: | ---: | ---: | ---: | --- |",
    ...rows.flatMap((row) =>
      METRICS.map((name) => {
        const metric = row.metrics[name];
        return `| ${row.route} | ${name} | ${format(name, metric.value)} | ${format(name, metric.baseline)} | ${metric.delta !== null && metric.delta >= 0 ? "+" : ""}${format(name, metric.delta)} | ${format(name, metric.limit)} | ${metric.passed ? "Pass" : "FAIL"} |`;
      }),
    ),
  ].join("\n");
}
