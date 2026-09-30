"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { handleAction } from "@/lib/admin/action-feedback";
import { createPlan, updatePlan } from "@/app/(admin)/admin/planos/actions";

export interface PlanFormCourse {
  id: string;
  title: string;
}

export interface PlanFormInitial {
  id: string;
  name: string;
  priceCents: number;
  interval: "MONTHLY" | "YEARLY";
  stripePriceId: string | null;
  mpPreapprovalPlanId: string | null;
  isAllCourses: boolean;
}

/** Formulário de plano (criar/editar). Cursos via checkbox quando não é "todos". */
export function PlanForm({
  plan,
  courses,
  selectedCourseIds,
}: {
  plan?: PlanFormInitial | null;
  courses: PlanFormCourse[];
  selectedCourseIds?: string[];
}) {
  const router = useRouter();
  const [name, setName] = useState(plan?.name ?? "");
  const [priceReais, setPriceReais] = useState(
    plan ? (plan.priceCents / 100).toFixed(2).replace(".", ",") : "0,00"
  );
  const [interval, setInterval] = useState<"MONTHLY" | "YEARLY">(plan?.interval ?? "MONTHLY");
  const [stripePriceId, setStripePriceId] = useState(plan?.stripePriceId ?? "");
  const [mpPlanId, setMpPlanId] = useState(plan?.mpPreapprovalPlanId ?? "");
  const [isAllCourses, setIsAllCourses] = useState(plan?.isAllCourses ?? true);
  const [checked, setChecked] = useState<string[]>(selectedCourseIds ?? []);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function toggleCourse(id: string) {
    setChecked((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const cents = Math.round(Number(priceReais.replace(/\./g, "").replace(",", ".")) * 100);
    if (!name.trim() || name.trim().length < 3) {
      setFormError("Nome muito curto");
      return;
    }
    if (!Number.isInteger(cents) || cents < 0) {
      setFormError("Preço inválido");
      return;
    }
    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("priceCents", String(cents));
    formData.set("interval", interval);
    formData.set("stripePriceId", stripePriceId.trim());
    formData.set("mpPreapprovalPlanId", mpPlanId.trim());
    if (isAllCourses) formData.set("isAllCourses", "on");
    checked.forEach((id) => formData.append("courseIds", id));

    setSaving(true);
    try {
      const ok = plan
        ? await handleAction(() => updatePlan(plan.id, formData), "Plano atualizado")
        : await handleAction(() => createPlan(formData), "Plano criado!");
      if (ok) router.push("/admin/planos");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
      <h1 className="text-[22px] font-bold text-textPrimary">
        {plan ? `Editar: ${plan.name}` : "Novo plano"}
      </h1>
      <div>
        <Label>Nome</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Plano Ilimitado" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Preço (R$)</Label>
          <Input value={priceReais} onChange={(e) => setPriceReais(e.target.value)} inputMode="decimal" required />
        </div>
        <div>
          <Label>Cobrança</Label>
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value as "MONTHLY" | "YEARLY")}
            className="h-9 w-full rounded-md border border-adminBorder bg-surface px-2 text-sm text-textPrimary"
          >
            <option value="MONTHLY">Mensal</option>
            <option value="YEARLY">Anual</option>
          </select>
        </div>
      </div>
      <div>
        <Label>Stripe Price ID (recorrente, criado no dashboard Stripe)</Label>
        <Input
          value={stripePriceId}
          onChange={(e) => setStripePriceId(e.target.value)}
          placeholder="price_…"
          className="font-mono"
        />
      </div>
      <div>
        <Label>MP Preapproval Plan ID (opcional)</Label>
        <Input
          value={mpPlanId}
          onChange={(e) => setMpPlanId(e.target.value)}
          placeholder="ID do plano no Mercado Pago"
          className="font-mono"
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={isAllCourses} onCheckedChange={setIsAllCourses} />
        <Label>Acesso a todos os cursos</Label>
      </div>
      {!isAllCourses && (
        <div className="rounded-lg border border-adminBorder bg-surface p-3 space-y-2 max-h-56 overflow-y-auto">
          <Label>Cursos incluídos</Label>
          {courses.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm text-textPrimary cursor-pointer">
              <input
                type="checkbox"
                checked={checked.includes(c.id)}
                onChange={() => toggleCourse(c.id)}
                className="accent-[#6D4FC7]"
              />
              {c.title}
            </label>
          ))}
          {courses.length === 0 && <p className="text-sm text-textSecondary">Nenhum curso cadastrado.</p>}
        </div>
      )}
      {formError && <p className="text-xs text-danger">{formError}</p>}
      <Button type="submit" variant="accent" disabled={saving}>
        {saving ? "Salvando..." : plan ? "Salvar alterações" : "Criar plano"}
      </Button>
    </form>
  );
}
