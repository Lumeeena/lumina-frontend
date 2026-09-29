# Chart Theming and Interaction Pattern

This document establishes the theming and interaction pattern for all charts in Lumina, following the Recharts library decision (ADR 0001).

## Overview

All charts in Lumina follow a consistent pattern for:
- **Theming**: Uses design tokens from `app/globals.css`
- **Accessibility**: Screen reader support, keyboard navigation, color independence
- **Responsive behavior**: Adapts to narrow screens
- **States**: Loading, empty, and insufficient-data states
- **Interaction**: Table view toggle, tooltips

## Component Structure

```
components/charts/
├── ChartContainer.tsx    # Card wrapper with theming and a11y
├── AreaChart.tsx         # Reference implementation
└── index.ts              # Public exports
```

## Theming Pattern

### Design Tokens

Charts use CSS custom properties from `app/globals.css`:

```css
/* Backgrounds */
--color-bg-subtle    # Card/panel fill
--color-bg-raised    # Tooltip fill

/* Text */
--color-text-primary    # Main text
--color-text-secondary  # Secondary text
--color-text-muted      # Axis labels

/* Borders */
--color-border-default   # Grid lines
--color-border-strong   # Hover states

/* Accent (violet) */
--color-accent-9      # Chart stroke
--color-accent-surface # Selected states
--color-accent-text    # Links and labels
```

### Implementation

All chart elements reference tokens directly in SVG attributes:

```tsx
<Area
  stroke="var(--color-accent-9)"
  fill="url(#lumina-area-fill)"
/>

<CartesianGrid
  stroke="var(--color-border-default)"
  strokeDasharray="3 3"
/>

<XAxis
  tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
/>
```

**Never use hex literals** in chart components. This ensures:
- Dark mode works automatically via `prefers-color-scheme`
- Manual theme toggle via `[data-theme]` works
- Single source of truth for colors
- Easy contrast auditing

## Accessibility Pattern

### 1. Screen Reader Support

Every chart includes:
- A descriptive `aria-label` on the container
- A hidden text summary with key statistics
- Proper table view for screen readers

```tsx
<ChartContainer
  title="Transfer Volume"
  description="Daily transfer volume over 30 days"
>
  <div className="sr-only" aria-live="polite">
    Shows 30 data points from Jan 1 to Jan 30. 
    Maximum: 1000 XLM. Minimum: 50 XLM.
  </div>
</ChartContainer>
```

### 2. Table View Alternative

Charts provide a toggle to show the same data as a table:

```tsx
<button
  onClick={() => setShowTable(!showTable)}
  aria-label={showTable ? "Hide data table" : "Show data table"}
>
  {showTable ? "Hide table" : "Show table"}
</button>
```

The table uses proper semantics:
```tsx
<table role="region" aria-label={`${title} data table`}>
  <thead>
    <tr>
      <th>Date</th>
      <th>Value</th>
    </tr>
  </thead>
  <tbody>
    {data.map((point) => (
      <tr key={index}>
        <td>{point.label}</td>
        <td>{point.value}</td>
      </tr>
    ))}
  </tbody>
</table>
```

### 3. Color Independence

Charts do not rely on color alone to convey information:
- Table view provides text-based alternative
- Tooltip shows exact values on hover
- Text summary provides key statistics
- Use patterns or textures if multiple series exist

### 4. Keyboard Navigation

Chart containers are focusable:
```tsx
<div role="img" aria-label={description} tabIndex={0}>
  {children}
</div>
```

## Responsive Behavior

### Default Dimensions

- Height: 280px (matches design system panel rhythm)
- Width: 100% (fluid container)
- Margins: Adjusted for readability on narrow screens

### Narrow Screen Handling

Charts automatically adapt via Recharts `ResponsiveContainer`:
- Margins reduce on narrow screens
- Font sizes remain readable (11px minimum)
- Table view remains scrollable on mobile

## States

### 1. Loading State

Shows a skeleton loader:

```tsx
if (loading) {
  return (
    <ChartContainer title={title} description="Loading...">
      <div className="w-full h-full animate-pulse bg-[var(--color-skeleton-bg)]" />
    </ChartContainer>
  );
}
```

### 2. Empty State

Shows when no data is available:

```tsx
if (isEmpty) {
  return (
    <ChartContainer title={title} description={emptyMessage}>
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-sm text-[var(--color-text-muted)]">
          {emptyMessage}
        </p>
      </div>
    </ChartContainer>
  );
}
```

### 3. Insufficient Data State

Shows when data exists but is insufficient for meaningful chart:

```tsx
if (hasInsufficientData) {
  return (
    <ChartContainer title={title} description={insufficientDataMessage}>
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-sm text-[var(--color-text-muted)]">
          {insufficientDataMessage}
        </p>
      </div>
    </ChartContainer>
  );
}
```

**Thresholds**:
- Area charts: Minimum 2 data points
- Line charts: Minimum 2 data points
- Bar charts: Minimum 1 data point

## Interaction Pattern

### 1. Tooltips

Tooltips are themed consistently:

```tsx
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
  }}
  itemStyle={{ color: "var(--color-accent-11)" }}
/>
```

### 2. Data Point Focus

Future interactive charts should:
- Make individual data points focusable
- Show tooltip on keyboard focus
- Support arrow key navigation between points

### 3. Animation

Animations are disabled by default for performance and accessibility:

```tsx
<Area isAnimationActive={false} />
```

## Chart Container Contract

Every chart must be wrapped in `ChartContainer`:

```tsx
export function MyChart({ data, title, description }) {
  return (
    <ChartContainer
      title={title}
      description={description}
      caption="Data source information"
      height={280}
      action={<OptionalAction />}
    >
      <RechartsComponent data={data} />
    </ChartContainer>
  );
}
```

**Required props**:
- `title`: Short, descriptive heading
- `description`: Screen reader description of chart meaning

**Optional props**:
- `caption`: Footnote or data source
- `height`: Custom height (default: 280px)
- `action`: Right-aligned action slot (e.g., toggle)

## Adding New Chart Types

When adding a new chart type:

1. **Follow the pattern**: Use `ChartContainer` wrapper
2. **Use design tokens**: No hex literals
3. **Add accessibility**: Table view, text summary, proper ARIA
4. **Define states**: Loading, empty, insufficient-data
5. **Document here**: Add specific guidance for the chart type

### Example: Adding a Bar Chart

```tsx
// components/charts/BarChart.tsx
import { Bar, BarChart, XAxis, YAxis, Tooltip } from "recharts";
import { ChartContainer } from "./ChartContainer";

export function BarChart({ data, title, description, unit }) {
  const [showTable, setShowTable] = useState(false);
  
  // Generate text summary
  const summary = `Shows ${data.length} items. ` +
    `Highest: ${Math.max(...data.map(d => d.value))}${unit}. ` +
    `Lowest: ${Math.min(...data.map(d => d.value))}${unit}.`;

  return (
    <ChartContainer
      title={title}
      description={description}
      action={
        <button onClick={() => setShowTable(!showTable)}>
          {showTable ? "Hide table" : "Show table"}
        </button>
      }
    >
      <div className="sr-only" aria-live="polite">{summary}</div>
      
      {showTable ? (
        <table>/* Table implementation */</table>
      ) : (
        <ResponsiveContainer>
          <RechartsBarChart data={data}>
            <XAxis dataKey="label" tick={{ fill: "var(--color-text-muted)" }} />
            <YAxis tick={{ fill: "var(--color-text-muted)" }} unit={unit} />
            <Tooltip contentStyle={{ background: "var(--color-bg-raised)" }} />
            <Bar dataKey="value" fill="var(--color-accent-9)" />
          </RechartsBarChart>
        </ResponsiveContainer>
      )}
    </ChartContainer>
  );
}
```

## Testing Checklist

When reviewing chart implementations:

- [ ] Uses only design tokens (no hex literals)
- [ ] Wrapped in `ChartContainer`
- [ ] Has descriptive `aria-label` / `description`
- [ ] Includes screen reader text summary
- [ ] Provides table view alternative
- [ ] Handles loading state
- [ ] Handles empty state
- [ ] Handles insufficient-data state
- [ ] Responsive on narrow screens
- [ ] Keyboard focusable
- [ ] Color-independent (table + text summary)
- [ ] Tooltips use design tokens
- [ ] Animations disabled (unless intentional)

## References

- ADR 0001: Charting library selection
- `docs/DESIGN_SYSTEM.md`: Design system overview
- `app/globals.css`: Design token definitions
- `components/charts/AreaChart.tsx`: Reference implementation
