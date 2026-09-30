import { mpPaymentClient } from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";
import { queueWelcomeEmail } from "@/lib/queue/producers/email";

export async function POST(req: Request) {
  const body = await req.json();
  if (body.type !== "payment") {
    return new Response("ignorado", { status: 200 });
  }

  const payment = await mpPaymentClient.get({ id: body.data.id });
  if (payment.status !== "approved") {
    return new Response("aguardando confirmação", { status: 200 });
  }

  const metadata = payment.metadata as unknown as { userId: string; courseId: string };
  const { userId, courseId } = metadata;

  // Se for pagamento de assinatura (external_reference no formato userId:planId ou com preapproval), estende período
  const externalRef = (payment as { external_reference?: string }).external_reference;
  if (externalRef && externalRef.includes(":") && !courseId) {
    const [subUserId, planId] = externalRef.split(":");
    await prisma.subscription.updateMany({
      where: { userId: subUserId, planId },
      data: {
        status: "ACTIVE",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    return new Response("ok", { status: 200 });
  }

  const existing = await prisma.payment.findUnique({
    where: { gatewayChargeId: String(payment.id) },
  });
  if (existing) return new Response("ok", { status: 200 });

  const method =
    payment.payment_type_id === "pix" ? "PIX" : payment.payment_type_id === "ticket" ? "BOLETO" : "CARD";

  await prisma.$transaction([
    prisma.payment.create({
      data: {
        userId,
        courseId,
        amountCents: Math.round((payment.transaction_amount ?? 0) * 100),
        method,
        gateway: "MERCADO_PAGO",
        gatewayChargeId: String(payment.id),
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

  return new Response("ok", { status: 200 });
}
