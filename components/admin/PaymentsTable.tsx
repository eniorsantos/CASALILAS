import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatCurrency, formatDateTime } from "@/lib/admin/format";
import type { FinanceOverview } from "@/lib/admin/queries";

const GATEWAY_LABEL: Record<string, string> = {
  STRIPE: "Stripe",
  MERCADO_PAGO: "Mercado Pago",
};

const METHOD_LABEL: Record<string, string> = {
  CARD: "Cartão",
  PIX: "Pix",
  BOLETO: "Boleto",
};

export function PaymentsTable({ payments }: { payments: FinanceOverview["recentPayments"] }) {
  return (
    <div className="bg-surface border border-adminBorder rounded-lg p-4">
      <div className="text-sm font-semibold text-textPrimary mb-2">Pagamentos recentes</div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-textSecondary">
              <th className="py-2 font-medium">Aluno</th>
              <th className="font-medium">Curso</th>
              <th className="font-medium">Gateway</th>
              <th className="font-medium">Método</th>
              <th className="font-medium">Valor</th>
              <th className="font-medium">Status</th>
              <th className="font-medium">Data</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t border-adminBorder">
                <td className="py-2 text-textPrimary">{p.userName}</td>
                <td className="text-textPrimary">{p.courseTitle}</td>
                <td className="text-textPrimary">{GATEWAY_LABEL[p.gateway] ?? p.gateway}</td>
                <td className="text-textPrimary">{METHOD_LABEL[p.method] ?? p.method}</td>
                <td className="text-textPrimary">{formatCurrency(p.amountCents)}</td>
                <td>
                  <StatusBadge status={p.status} />
                </td>
                <td className="text-textPrimary">{p.paidAt ? formatDateTime(p.paidAt) : "—"}</td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={7} className="py-4 text-textSecondary">
                  Nenhum pagamento ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
