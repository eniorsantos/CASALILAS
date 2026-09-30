export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getPlansForAdmin } from "@/lib/admin/queries";
import { PlansTable, NewPlanButton } from "@/components/admin/PlansTable";
import { DataStateWrapper, EmptyActionLink } from "@/components/admin/DataStateWrapper";

export default async function PlansPage() {
  const user = await getCurrentUser();
  if ((user as { role?: string } | null)?.role !== "ADMIN") redirect("/admin");

  const plans = await getPlansForAdmin();

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-[22px] font-bold text-textPrimary">Planos de assinatura</h1>
        <NewPlanButton />
      </div>
      <DataStateWrapper
        loading={false}
        empty={plans.length === 0}
        emptyState={{
          title: "Nenhum plano cadastrado",
          description: "Crie o primeiro plano recorrente da plataforma.",
          action: <EmptyActionLink href="/admin/planos/novo" label="Criar primeiro plano" />,
        }}
      >
        <PlansTable
          plans={plans.map((p) => ({
            id: p.id,
            name: p.name,
            priceCents: p.priceCents,
            interval: p.interval,
            isAllCourses: p.isAllCourses,
            subscriptions: p._count.subscriptions,
          }))}
        />
      </DataStateWrapper>
    </div>
  );
}
