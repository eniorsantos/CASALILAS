import { MercadoPagoConfig, PreApproval } from "mercadopago";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isGatewayEnabled } from "@/lib/admin/gateways";

function getPreapprovalClient() {
  // Construído dentro do handler para não quebrar o `next build` sem token real.
  const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN ?? "TEST_DUMMY",
  });
  return new PreApproval(client);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Não autorizado", { status: 401 });
  if (!(await isGatewayEnabled("MERCADO_PAGO"))) {
    return new Response("Assinaturas via Mercado Pago temporariamente desligadas", { status: 503 });
  }
  const preapprovalClient = getPreapprovalClient();
  const { planId } = await req.json();
  const plan = await prisma.plan.findUniqueOrThrow({ where: { id: planId } });

  const preapproval = await preapprovalClient.create({
    body: {
      reason: plan.name,
      payer_email: (user as { email: string }).email,
      external_reference: `${(user as { id: string }).id}:${plan.id}`,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: plan.priceCents / 100,
        currency_id: "BRL",
      },
      back_url: `${process.env.APP_URL}/checkout/sucesso`,
      status: "pending",
    },
  });

  return Response.json({ url: preapproval.init_point });
}
