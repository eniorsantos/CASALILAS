import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isGatewayEnabled } from "@/lib/admin/gateways";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Não autorizado", { status: 401 });
  if (!(await isGatewayEnabled("STRIPE"))) {
    return new Response("Assinaturas via Stripe temporariamente desligadas", { status: 503 });
  }
  const { planId } = await req.json();
  const plan = await prisma.plan.findUniqueOrThrow({ where: { id: planId } });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: (user as { email: string }).email,
    line_items: [{ price: plan.stripePriceId!, quantity: 1 }],
    metadata: { userId: (user as { id: string }).id, planId: plan.id },
    success_url: `${process.env.APP_URL}/checkout/sucesso`,
    cancel_url: `${process.env.APP_URL}/planos`,
  });

  return Response.json({ url: session.url });
}
