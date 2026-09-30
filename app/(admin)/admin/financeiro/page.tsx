export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getFinanceOverview } from "@/lib/admin/queries";
import { formatCurrency } from "@/lib/admin/format";
import { StatCard } from "@/components/admin/StatCard";
import { PaymentsTable } from "@/components/admin/PaymentsTable";
import { SubscriptionsTable } from "@/components/admin/SubscriptionsTable";
import { ExportCsvButton } from "@/components/admin/ExportCsvButton";
import { Button } from "@/components/ui/button";

const PERIODS = [
  { label: "7 dias", days: "7" },
  { label: "30 dias", days: "30" },
  { label: "90 dias", days: "90" },
  { label: "Tudo", days: "" },
];

export default async function FinancePage({
  searchParams,
}: {
  searchParams: { days?: string; gateway?: string };
}) {
  const user = await getCurrentUser();
  if ((user as { role?: string } | null)?.role !== "ADMIN") redirect("/admin");

  const days = searchParams.days ? Number(searchParams.days) : undefined;
  const gateway =
    searchParams.gateway === "STRIPE" || searchParams.gateway === "MERCADO_PAGO"
      ? searchParams.gateway
      : undefined;

  const data = await getFinanceOverview({
    ...(days ? { days } : {}),
    ...(gateway ? { gateway } : {}),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-[22px] font-bold text-textPrimary">Financeiro</h1>
        <form method="GET" className="flex gap-2 items-center">
          <select
            name="days"
            defaultValue={searchParams.days ?? "30"}
            className="h-9 rounded-md border border-adminBorder bg-surface px-2 text-sm text-textPrimary"
          >
            {PERIODS.map((p) => (
              <option key={p.label} value={p.days}>
                {p.label}
              </option>
            ))}
          </select>
          <select
            name="gateway"
            defaultValue={searchParams.gateway ?? ""}
            className="h-9 rounded-md border border-adminBorder bg-surface px-2 text-sm text-textPrimary"
          >
            <option value="">Todos gateways</option>
            <option value="STRIPE">Stripe</option>
            <option value="MERCADO_PAGO">Mercado Pago</option>
          </select>
          <Button type="submit" variant="outline" size="sm">
            Filtrar
          </Button>
          <ExportCsvButton payments={data.recentPayments} />
        </form>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Receita no período" value={formatCurrency(data.periodRevenueCents)} />
        <StatCard label="Receita total" value={formatCurrency(data.totalRevenueCents)} />
        <StatCard
          label="Assinaturas ativas"
          value={`${data.activeSubscriptions} (${data.pastDueSubscriptions} em atraso)`}
        />
        <StatCard label="MRR" value={formatCurrency(data.mrrCents)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Taxa de churn" value={`${data.churnRate}%`} />
      </div>
      <SubscriptionsTable subscriptions={data.subscriptions} />
      <PaymentsTable payments={data.recentPayments} />
    </div>
  );
}
