"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";
import { formatDate } from "@/lib/admin/format";
import { handleAction } from "@/lib/admin/action-feedback";
import { cancelSubscription } from "@/app/(admin)/admin/financeiro/actions";
import type { FinanceOverview } from "@/lib/admin/queries";

export function SubscriptionsTable({
  subscriptions,
}: {
  subscriptions: FinanceOverview["subscriptions"];
}) {
  const router = useRouter();
  const [confirm, setConfirm] = useState<FinanceOverview["subscriptions"][number] | null>(null);

  return (
    <>
      <div className="bg-surface border border-adminBorder rounded-lg p-4">
        <div className="text-sm font-semibold text-textPrimary mb-2">Assinaturas</div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-textSecondary">
                <th className="py-2 font-medium">Aluno</th>
                <th className="font-medium">Plano</th>
                <th className="font-medium">Gateway</th>
                <th className="font-medium">Status</th>
                <th className="font-medium">Válida até</th>
                <th className="font-medium" />
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((s) => (
                <tr key={s.id} className="border-t border-adminBorder">
                  <td className="py-2">
                    <div className="text-textPrimary">{s.userName}</div>
                    <div className="text-textSecondary text-xs">{s.userEmail}</div>
                  </td>
                  <td className="text-textPrimary">{s.planName}</td>
                  <td className="text-textPrimary">{s.gateway === "STRIPE" ? "Stripe" : "Mercado Pago"}</td>
                  <td>
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="text-textPrimary">{formatDate(s.currentPeriodEnd)}</td>
                  <td>
                    {["ACTIVE", "PAST_DUE"].includes(s.status) && (
                      <Button size="sm" variant="outline" onClick={() => setConfirm(s)}>
                        Cancelar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {subscriptions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-textSecondary">
                    Nenhuma assinatura ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmDeleteDialog
        itemName={confirm ? `${confirm.planName} — ${confirm.userEmail}` : ""}
        open={!!confirm}
        onOpenChange={(open) => !open && setConfirm(null)}
        onConfirm={async () => {
          if (!confirm) return;
          const ok = await handleAction(
            () => cancelSubscription(confirm.id),
            "Assinatura cancelada (acesso vale até o fim do período)"
          );
          if (ok) {
            setConfirm(null);
            router.refresh();
          }
        }}
      />
    </>
  );
}
