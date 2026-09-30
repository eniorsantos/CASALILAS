import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export type GatewayName = "STRIPE" | "MERCADO_PAGO";

const ENABLED_KEYS: Record<GatewayName, string> = {
  STRIPE: "payments.stripe.enabled",
  MERCADO_PAGO: "payments.mercadopago.enabled",
};

const WEBHOOK_PATHS: Record<GatewayName, string> = {
  STRIPE: "/api/webhooks/stripe",
  MERCADO_PAGO: "/api/webhooks/mercadopago",
};

function isDummy(value: string | undefined): boolean {
  if (!value) return true;
  const v = value.toLowerCase();
  return v === "" || v.includes("dummy") || v.includes("test_dummy");
}

export function maskKey(value: string | undefined): string {
  if (!value) return "não configurada";
  if (isDummy(value)) return "dummy (dev)";
  return `${value.slice(0, 7)}••••••`;
}

function detectMode(key: string | undefined): "live" | "test" | "unset" {
  if (!key || isDummy(key)) return "unset";
  if (key.startsWith("sk_live") || key.startsWith("APP_USR-")) return "live";
  return "test";
}

/** Liga/desliga contam no checkout. Default ligado (ausência = true). */
export async function isGatewayEnabled(gateway: GatewayName): Promise<boolean> {
  const row = await prisma.systemSetting.findUnique({
    where: { key: ENABLED_KEYS[gateway] },
  });
  if (!row) return true;
  return row.value === "true";
}

export async function setGatewayEnabledRaw(gateway: GatewayName, enabled: boolean): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key: ENABLED_KEYS[gateway] },
    update: { value: String(enabled) },
    create: { key: ENABLED_KEYS[gateway], value: String(enabled) },
  });
}

export interface GatewayStatus {
  gateway: GatewayName;
  label: string;
  enabled: boolean;
  configured: boolean;
  mode: "live" | "test" | "unset";
  maskedKey: string;
  webhookUrl: string;
}

/** Status consolidado p/ a tela de configuração (só ADMIN). */
export async function getGatewayStatusList(): Promise<GatewayStatus[]> {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const mpToken = process.env.MP_ACCESS_TOKEN;

  const [stripeOn, mpOn] = await Promise.all([
    isGatewayEnabled("STRIPE"),
    isGatewayEnabled("MERCADO_PAGO"),
  ]);

  return [
    {
      gateway: "STRIPE",
      label: "Stripe (cartão internacional + assinaturas)",
      enabled: stripeOn,
      configured: !isDummy(stripeKey),
      mode: stripeKey?.startsWith("sk_live") ? "live" : stripeKey?.startsWith("sk_test") ? "test" : "unset",
      maskedKey: maskKey(stripeKey),
      webhookUrl: `${appUrl}${WEBHOOK_PATHS.STRIPE}`,
    },
    {
      gateway: "MERCADO_PAGO",
      label: "Mercado Pago (Pix, boleto e cartão BR)",
      enabled: mpOn,
      configured: !isDummy(mpToken),
      mode: detectMode(mpToken),
      maskedKey: maskKey(mpToken),
      webhookUrl: `${appUrl}${WEBHOOK_PATHS.MERCADO_PAGO}`,
    },
  ];
}

/** Testa a chave Stripe com uma leitura barata. Nunca expõe o segredo. */
export async function testStripeConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const balance = await stripe.balance.retrieve();
    const available = balance.available.map((b) => `${(b.amount / 100).toFixed(2)} ${b.currency.toUpperCase()}`);
    return { ok: true, message: `Conectado. Saldo disponível: ${available.join(", ") || "—"}` };
  } catch (err) {
    return { ok: false, message: `Falha: ${(err as Error).message}` };
  }
}

/** Testa o token MP listando meios de pagamento (leitura pública autenticada). */
export async function testMercadoPagoConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const res = await fetch("https://api.mercadopago.com/v1/payment_methods", {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    });
    if (!res.ok) return { ok: false, message: `Falha: HTTP ${res.status} — confira o token` };
    const methods = (await res.json()) as unknown[];
    return { ok: true, message: `Conectado. ${methods.length} meios de pagamento retornados.` };
  } catch (err) {
    return { ok: false, message: `Falha: ${(err as Error).message}` };
  }
}
