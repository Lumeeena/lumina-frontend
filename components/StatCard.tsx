import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
}

export default function StatCard({ title, value, subtitle, icon }: StatCardProps) {
  return (
    <div className="p-[18px] rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border-default)]">
      {icon && <div className="mb-3 text-[var(--color-accent-text)]">{icon}</div>}
      <div className="text-2xl font-bold text-[var(--color-text-primary)] mono">{value}</div>
      <div className="text-[13px] font-semibold text-[var(--color-text-secondary)] mt-1">{title}</div>
      {subtitle && <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5 leading-snug">{subtitle}</div>}
    </div>
  );
}
