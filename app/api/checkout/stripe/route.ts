import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { isGatewayEnabled } from "@/lib/admin/gateways";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Não autorizado", { status: 401 });
  if (!(await isGatewayEnabled("STRIPE"))) {
    return new Response("Pagamentos via Stripe temporariamente desligados", { status: 503 });
  }
  const { courseId } = await req.json();
  const course = await prisma.course.findUniqueOrThrow({ where: { id: courseId } });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: (user as { email: string }).email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: course.priceCents,
          product_data: { name: course.title },
        },
        quantity: 1,
      },
    ],
    metadata: { userId: (user as { id: string }).id, courseId: course.id },
    success_url: `${process.env.APP_URL}/checkout/sucesso?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.APP_URL}/curso/${course.slug}`,
  });

  return Response.json({ url: session.url });
}
