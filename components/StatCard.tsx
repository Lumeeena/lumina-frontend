import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
}

export default function StatCard({ title, value, subtitle, icon }: StatCardProps) {
  return (
    <div className="p-[18px] rounded-xl bg-white border border-[#e5e3ea]">
      {icon && <div className="mb-3 text-[#8b5cf6]">{icon}</div>}
      <div className="text-2xl font-bold text-[#0e0e12] mono">{value}</div>
      <div className="text-[13px] font-semibold text-[#3f3d47] mt-1">{title}</div>
      {subtitle && <div className="text-[11px] text-[#a6a3b0] mt-0.5 leading-snug">{subtitle}</div>}
    </div>
  );
}
