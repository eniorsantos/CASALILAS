export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getGatewayStatusList } from "@/lib/admin/gateways";
import { GatewayCard } from "@/components/admin/GatewayCard";
import { Label } from "@/components/ui/label";

export default async function ConfigPage() {
  const user = await getCurrentUser();
  if ((user as { role?: string } | null)?.role !== "ADMIN") redirect("/admin");

  const gateways = await getGatewayStatusList();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-[22px] font-bold text-textPrimary">Configurações</h1>

      <div>
        <h2 className="text-base font-semibold text-textPrimary mb-3">Gateways de pagamento</h2>
        <div className="space-y-4">
          {gateways.map((g) => (
            <GatewayCard key={g.gateway} gateway={g} />
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-adminBorder bg-surface p-4 space-y-3">
        <div>
          <Label>Monitoramento de filas</Label>
          <p className="text-sm text-textSecondary mt-1">
            Acompanhe emails, certificados e webhooks de vídeo no Bull Board.
          </p>
          <p className="text-sm text-textPrimary mt-1 font-mono">:3001/admin/queues</p>
        </div>
      </div>

      <p className="text-xs text-textSecondary">
        Chaves e segredos vivem em Vercel/Railway env vars — esta tela mostra status
        mascarado e permite ligar/desligar cada gateway e testar a conexão. Ver
        docs/DEPLOY-PRODUCAO.md no repositório.
      </p>
    </div>
  );
}
