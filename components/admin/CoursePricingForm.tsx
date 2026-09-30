"use client";

import { useState } from "react";
import { updateCourse } from "@/app/(admin)/admin/cursos/actions";
import { handleAction } from "@/lib/admin/action-feedback";
import { formatCurrency } from "@/lib/admin/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CoursePricingForm({
  course,
}: {
  course: { id: string; title: string; description: string; priceCents: number };
}) {
  const [reais, setReais] = useState((course.priceCents / 100).toFixed(2).replace(".", ","));
  const [saving, setSaving] = useState(false);

  async function onSave() {
    const cents = Math.round(Number(reais.replace(/\./g, "").replace(",", ".")) * 100);
    if (!Number.isInteger(cents) || cents < 0) return;
    const formData = new FormData();
    formData.set("title", course.title);
    formData.set("description", course.description);
    formData.set("priceCents", String(cents));
    setSaving(true);
    try {
      await handleAction(() => updateCourse(course.id, formData), "Preço atualizado");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 max-w-xl">
      <div>
        <Label>Preço (R$)</Label>
        <Input value={reais} onChange={(e) => setReais(e.target.value)} inputMode="decimal" />
        <p className="text-xs text-textSecondary mt-1">
          Valor atual: {formatCurrency(course.priceCents)} · sempre salvo em centavos no banco.
        </p>
      </div>
      <Button variant="accent" disabled={saving} onClick={onSave}>
        {saving ? "Salvando..." : "Salvar preço"}
      </Button>
    </div>
  );
}
