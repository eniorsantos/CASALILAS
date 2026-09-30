export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getTokenUser, unauthorizedResponse } from "@/lib/mobile-auth";

/** Planos de assinatura (perfil do app). */
export async function GET(req: Request) {
  try {
    getTokenUser(req);
    const plans = await prisma.plan.findMany({ orderBy: { priceCents: "asc" } });
    return Response.json(
      plans.map((p) => ({
        id: p.id,
        name: p.name,
        priceCents: p.priceCents,
        interval: p.interval,
        isAllCourses: p.isAllCourses,
      }))
    );
  } catch (err) {
    return unauthorizedResponse(err);
  }
}
