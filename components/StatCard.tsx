import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
}

export default function StatCard({ title, value, subtitle, icon }: StatCardProps) {
  return (
    <div className="p-5 rounded-xl bg-[#0c1222] border border-[#162032]">
      {icon && <div className="mb-3 text-cyan-400">{icon}</div>}
      <div className="text-2xl font-bold text-white mono">{value}</div>
      <div className="text-sm font-medium text-slate-400 mt-1">{title}</div>
      {subtitle && <div className="text-xs text-slate-500 mt-0.5 leading-snug">{subtitle}</div>}
    </div>
  );
}
