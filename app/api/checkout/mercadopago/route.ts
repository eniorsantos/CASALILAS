import { preferenceClient } from "@/lib/mercadopago";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isGatewayEnabled } from "@/lib/admin/gateways";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Não autorizado", { status: 401 });
  if (!(await isGatewayEnabled("MERCADO_PAGO"))) {
    return new Response("Pagamentos via Mercado Pago temporariamente desligados", { status: 503 });
  }
  const { courseId } = await req.json();
  const course = await prisma.course.findUniqueOrThrow({ where: { id: courseId } });

  const preference = await preferenceClient.create({
    body: {
      items: [
        {
          id: course.id,
          title: course.title,
          quantity: 1,
          unit_price: course.priceCents / 100,
          currency_id: "BRL",
        },
      ],
      payer: { email: (user as { email: string }).email },
      metadata: { userId: (user as { id: string }).id, courseId: course.id },
      back_urls: {
        success: `${process.env.APP_URL}/checkout/sucesso`,
        failure: `${process.env.APP_URL}/curso/${course.slug}`,
      },
      notification_url: `${process.env.APP_URL}/api/webhooks/mercadopago`,
      payment_methods: { excluded_payment_types: [] },
    },
  });

  return Response.json({ url: preference.init_point });
}
