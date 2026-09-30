import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend?: number;
}) {
  return (
    <div className="bg-surface border border-adminBorder rounded-lg p-4">
      <div className="text-xs text-textSecondary mb-1">{label}</div>
      <div className="text-2xl font-bold text-textPrimary">{value}</div>
      {trend !== undefined && (
        <div
          className={cn(
            "text-xs mt-1 flex items-center gap-1",
            trend >= 0 ? "text-success" : "text-danger"
          )}
        >
          {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(trend)}% vs. mês anterior
        </div>
      )}
    </div>
  );
}
