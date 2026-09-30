"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";
import { formatCurrency } from "@/lib/admin/format";
import { handleAction } from "@/lib/admin/action-feedback";
import { deletePlan } from "@/app/(admin)/admin/planos/actions";

export interface PlanRow {
  id: string;
  name: string;
  priceCents: number;
  interval: string;
  isAllCourses: boolean;
  subscriptions: number;
}

export function PlansTable({ plans }: { plans: PlanRow[] }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState<PlanRow | null>(null);

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-adminBorder">
        <table className="w-full text-sm bg-surface">
          <thead className="bg-surfaceMuted">
            <tr className="text-left text-textSecondary">
              <th className="px-4 py-3 font-medium">Plano</th>
              <th className="px-4 py-3 font-medium">Preço</th>
              <th className="px-4 py-3 font-medium">Cobertura</th>
              <th className="px-4 py-3 font-medium">Assinaturas</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id} className="border-t border-adminBorder hover:bg-surfaceMuted">
                <td className="px-4 py-3 font-medium text-textPrimary">{p.name}</td>
                <td className="px-4 py-3 text-textPrimary">
                  {formatCurrency(p.priceCents)} / {p.interval === "MONTHLY" ? "mês" : "ano"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.isAllCourses ? "ACTIVE" : "PENDING"} />
                </td>
                <td className="px-4 py-3 text-textPrimary">{p.subscriptions}</td>
                <td className="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="p-1 text-textSecondary hover:text-textPrimary">
                      <MoreVertical size={16} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/planos/${p.id}`}>Editar</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-danger" onClick={() => setConfirm(p)}>
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmDeleteDialog
        itemName={confirm?.name ?? ""}
        open={!!confirm}
        onOpenChange={(open) => !open && setConfirm(null)}
        onConfirm={async () => {
          if (!confirm) return;
          const ok = await handleAction(() => deletePlan(confirm.id), "Plano excluído");
          if (ok) {
            setConfirm(null);
            router.refresh();
          }
        }}
      />
    </>
  );
}

export function NewPlanButton() {
  return (
    <Link href="/admin/planos/novo">
      <Button variant="accent">
        <Plus size={16} /> Novo plano
      </Button>
    </Link>
  );
}
