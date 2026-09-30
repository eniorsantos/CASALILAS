"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { handleAction } from "@/lib/admin/action-feedback";
import { setGatewayEnabled, testStripe, testMercadoPago } from "@/app/(admin)/admin/config/actions";
import type { GatewayStatus } from "@/lib/admin/gateways";

export function GatewayCard({ gateway }: { gateway: GatewayStatus }) {
  const router = useRouter();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function onTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const result =
        gateway.gateway === "STRIPE" ? await testStripe() : await testMercadoPago();
      setTestResult(result);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="rounded-lg border border-adminBorder bg-surface p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-textPrimary">
          {gateway.gateway === "STRIPE" ? "Stripe" : "Mercado Pago"}
        </h2>
        <div className="flex gap-2">
          <Badge variant={gateway.enabled ? "success" : "default"}>
            {gateway.enabled ? "Ativo" : "Desligado"}
          </Badge>
          <Badge
            variant={
              gateway.mode === "live" ? "success" : gateway.mode === "test" ? "warning" : "outline"
            }
          >
            {gateway.mode === "live" ? "Live" : gateway.mode === "test" ? "Teste" : "Sem chave"}
          </Badge>
        </div>
      </div>
      <p className="text-sm text-textSecondary">{gateway.label}</p>
      <div>
        <Label>Chave atual (mascarada)</Label>
        <p className="font-mono text-sm text-textPrimary mt-1">{gateway.maskedKey}</p>
      </div>
      <div>
        <Label>Webhook — cadastre esta URL no dashboard do gateway</Label>
        <p className="font-mono text-xs text-textPrimary mt-1 break-all">{gateway.webhookUrl}</p>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={gateway.enabled}
          onCheckedChange={(v) =>
            handleAction(() => setGatewayEnabled(gateway.gateway, v), "Gateway atualizado").then(
              (ok) => ok && router.refresh()
            )
          }
        />
        <Label>Aceitar pagamentos por este gateway</Label>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" disabled={testing} onClick={onTest}>
          {testing ? "Testando..." : "Testar conexão"}
        </Button>
        {testResult && (
          <p className={`text-xs ${testResult.ok ? "text-success" : "text-danger"}`}>
            {testResult.message}
          </p>
        )}
      </div>
    </div>
  );
}
