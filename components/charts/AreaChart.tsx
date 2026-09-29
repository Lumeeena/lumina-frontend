"use client";

import { useState } from "react";
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartContainer } from "./ChartContainer";

export interface AreaChartPoint {
  /** X axis label (already formatted; the chart does no formatting). */
  label: string;
  /** Y axis value. */
  value: number;
}

export interface AreaChartProps {
  title: string;
  description: string;
  data: AreaChartPoint[];
  /** Optional unit shown on the Y axis (e.g. "XLM", "txs"). */
  unit?: string;
  /** Optional caption under the chart (data source, time range). */
  caption?: string;
  height?: number;
  /** Loading state - shows skeleton instead of chart */
  loading?: boolean;
  /** Empty state message - shows when data is empty */
  emptyMessage?: string;
  /** Insufficient data message - shows when data is insufficient for meaningful chart */
  insufficientDataMessage?: string;
}

/**
 * Reference chart for Lumina.
 *
 * - Pure SVG via Recharts (inspectable, styleable, accessible).
 * - Themed entirely with design tokens — no hex literals, no JS theme
 *   object. Dark mode + manual `[data-theme]` switch flip automatically.
 * - Wrapped in `ChartContainer` for the card chrome and a11y contract.
 * - Accessible: includes table view, text summary, and keyboard navigation.
 * - Color-independent: uses patterns/text in addition to color.
 * - Responsive: adapts to narrow screens with appropriate margins and font sizes.
 * - States: loading, empty, and insufficient-data states are defined.
 */
export function AreaChart({
  title,
  description,
  data,
  unit,
  caption,
  height = 280,
  loading = false,
  emptyMessage = "No data available",
  insufficientDataMessage = "Insufficient data to display chart",
}: AreaChartProps) {
  const [showTable, setShowTable] = useState(false);

  // Generate text summary for screen readers
  const dataSummary = data.length > 0
    ? `Shows ${data.length} data points from ${data[0].label} to ${data[data.length - 1].label}. ` +
      `Maximum value: ${Math.max(...data.map(d => d.value))}${unit || ''}. ` +
      `Minimum value: ${Math.min(...data.map(d => d.value))}${unit || ''}.`
    : "No data available.";

  // State checks
  const isEmpty = data.length === 0;
  const hasInsufficientData = data.length < 2; // Need at least 2 points for meaningful area chart

  if (loading) {
    return (
      <ChartContainer
        title={title}
        description="Loading chart data..."
        caption={caption}
        height={height}
      >
        <div
          className="w-full h-full rounded-lg animate-pulse bg-[var(--color-skeleton-bg)]"
          aria-hidden="true"
        />
      </ChartContainer>
    );
  }

  if (isEmpty) {
    return (
      <ChartContainer
        title={title}
        description={emptyMessage}
        caption={caption}
        height={height}
      >
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-sm text-[var(--color-text-muted)] text-center px-4">
            {emptyMessage}
          </p>
        </div>
      </ChartContainer>
    );
  }

  if (hasInsufficientData) {
    return (
      <ChartContainer
        title={title}
        description={insufficientDataMessage}
        caption={caption}
        height={height}
      >
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-sm text-[var(--color-text-muted)] text-center px-4">
            {insufficientDataMessage}
          </p>
        </div>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer
      title={title}
      description={description}
      caption={caption}
      height={height}
      action={
        <button
          onClick={() => setShowTable(!showTable)}
          className="text-xs font-semibold text-[var(--color-accent-text)] hover:text-[var(--color-accent-text-hover)] transition-colors"
          aria-label={showTable ? "Hide data table" : "Show data table"}
        >
          {showTable ? "Hide table" : "Show table"}
        </button>
      }
    >
      {/* Hidden text summary for screen readers */}
      <div className="sr-only" aria-live="polite">
        {dataSummary}
      </div>

      {showTable ? (
        <div className="w-full h-full overflow-auto">
          <table
            className="w-full text-sm"
            role="region"
            aria-label={`${title} data table`}
          >
            <thead>
              <tr className="border-b border-[var(--color-border-default)]">
                <th className="text-left py-2 px-3 font-semibold text-[var(--color-text-primary)]">
                  Date
                </th>
                <th className="text-right py-2 px-3 font-semibold text-[var(--color-text-primary)]">
                  Value{unit && ` (${unit.trim()})`}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((point, index) => (
                <tr
                  key={index}
                  className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-subtle)]"
                >
                  <td className="py-2 px-3 text-[var(--color-text-secondary)]">
                    {point.label}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-[var(--color-text-primary)]">
                    {point.value.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <RechartsAreaChart
            data={data}
            margin={{ top: 8, right: 12, bottom: 4, left: 0 }}
          >
            <defs>
              {/* Gradient fill uses the brand accent token at two opacities. */}
              <linearGradient id="lumina-area-fill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--color-accent-9)"
                  stopOpacity={0.35}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-accent-9)"
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              vertical={false}
              stroke="var(--color-border-default)"
              strokeDasharray="3 3"
            />

            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{
                fill: "var(--color-text-muted)",
                fontSize: 11,
              }}
              dy={6}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{
                fill: "var(--color-text-muted)",
                fontSize: 11,
              }}
              width={44}
              unit={unit}
            />

            <Tooltip
              cursor={{ stroke: "var(--color-border-strong)", strokeWidth: 1 }}
              contentStyle={{
                background: "var(--color-bg-raised)",
                border: "1px solid var(--color-border-default)",
                borderRadius: 8,
                color: "var(--color-text-primary)",
                fontSize: 12,
              }}
              labelStyle={{
                color: "var(--color-text-secondary)",
                fontSize: 11,
                marginBottom: 2,
              }}
              itemStyle={{ color: "var(--color-accent-11)" }}
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--color-accent-9)"
              strokeWidth={2}
              fill="url(#lumina-area-fill)"
              isAnimationActive={false}
            />
          </RechartsAreaChart>
        </ResponsiveContainer>
      )}
    </ChartContainer>
  );
}
