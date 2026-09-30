"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/admin/format";

export function RevenueChart({ data }: { data: { date: string; revenueCents: number }[] }) {
  return (
    <div className="bg-surface border border-adminBorder rounded-lg p-4">
      <div className="text-sm font-semibold text-textPrimary mb-4">Receita — últimos 30 dias</div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data}>
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v: number) => `R$${v / 100}`} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
          <Line type="monotone" dataKey="revenueCents" stroke="#6D4FC7" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
