import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { queueWelcomeEmail } from "@/lib/queue/producers/email";

export async function POST(req: Request) {
  const body = await req.text();
  // Lê do Request (não de next/headers) — idêntico em produção e testável em Vitest.
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Sem assinatura", { status: 400 });

  let event: import("stripe").default.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return new Response(`Webhook inválido: ${(err as Error).message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as import("stripe").default.Checkout.Session;

    if (session.mode === "subscription") {
      const { userId, planId } = session.metadata as { userId: string; planId: string };
      const stripeSubId = session.subscription as string;
      const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
      const existing = await prisma.subscription.findUnique({
        where: { gatewaySubscriptionId: stripeSubId },
      });
      if (!existing) {
        await prisma.subscription.create({
          data: {
            userId,
            planId,
            gateway: "STRIPE",
            gatewaySubscriptionId: stripeSubId,
            status: "ACTIVE",
            currentPeriodEnd: new Date(
              (stripeSub as { current_period_end: number }).current_period_end * 1000
            ),
          },
        });
      }
      return new Response("ok", { status: 200 });
    }

    const { userId, courseId } = session.metadata as { userId: string; courseId: string };
    const existing = await prisma.payment.findUnique({
      where: { gatewayChargeId: session.id },
    });
    if (existing) return new Response("ok", { status: 200 });

    await prisma.$transaction([
      prisma.payment.create({
        data: {
          userId,
          courseId,
          amountCents: session.amount_total ?? 0,
          method: "CARD",
          gateway: "STRIPE",
          gatewayChargeId: session.id,
          status: "PAID",
          paidAt: new Date(),
        },
      }),
      prisma.enrollment.upsert({
        where: { userId_courseId: { userId, courseId } },
        create: { userId, courseId, status: "ACTIVE" },
        update: { status: "ACTIVE" },
      }),
    ]);

    await queueWelcomeEmail(userId, courseId);
  }

  if (event.type === "invoice.paid") {
    const invoice = event.data.object as { subscription?: string | null };
    if (invoice.subscription) {
      const stripeSubId = invoice.subscription as string;
      const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
      await prisma.subscription.updateMany({
        where: { gatewaySubscriptionId: stripeSubId },
        data: {
          status: "ACTIVE",
          currentPeriodEnd: new Date(
            (stripeSub as { current_period_end: number }).current_period_end * 1000
          ),
        },
      });
    }
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as { subscription?: string | null };
    if (invoice.subscription) {
      await prisma.subscription.updateMany({
        where: { gatewaySubscriptionId: invoice.subscription as string },
        data: { status: "PAST_DUE" },
      });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as { id: string };
    await prisma.subscription.updateMany({
      where: { gatewaySubscriptionId: sub.id },
      data: { status: "CANCELED", canceledAt: new Date() },
    });
  }

  return new Response("ok", { status: 200 });
}
