"use client";

import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime } from "@/lib/admin/format";
import type { FinanceOverview } from "@/lib/admin/queries";

/** Exporta os pagamentos filtrados em CSV (conciliação/contabilidade). */
export function ExportCsvButton({ payments }: { payments: FinanceOverview["recentPayments"] }) {
  function onExport() {
    const header = "data;aluno;curso;gateway;metodo;valor_centavos;valor;status";
    const lines = payments.map((p) =>
      [
        p.paidAt ? formatDateTime(p.paidAt) : "",
        `"${p.userName.replace(/"/g, "")}"`,
        `"${p.courseTitle.replace(/"/g, "")}"`,
        p.gateway,
        p.method,
        p.amountCents,
        formatCurrency(p.amountCents),
        p.status,
      ].join(";")
    );
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pagamentos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button size="sm" variant="outline" onClick={onExport} disabled={payments.length === 0}>
      Exportar CSV
    </Button>
  );
}
