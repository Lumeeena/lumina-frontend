"use client";

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
}

/**
 * Reference chart for Lumina.
 *
 * - Pure SVG via Recharts (inspectable, styleable, accessible).
 * - Themed entirely with design tokens — no hex literals, no JS theme
 *   object. Dark mode + manual `[data-theme]` switch flip automatically.
 * - Wrapped in `ChartContainer` for the card chrome and a11y contract.
 */
export function AreaChart({
  title,
  description,
  data,
  unit,
  caption,
  height = 280,
}: AreaChartProps) {
  return (
    <ChartContainer
      title={title}
      description={description}
      caption={caption}
      height={height}
    >
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
    </ChartContainer>
  );
}
