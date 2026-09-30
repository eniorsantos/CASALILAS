export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getTokenUser, unauthorizedResponse } from "@/lib/mobile-auth";

/** Resumo do curso por id (p/ o modal de checkout). */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    getTokenUser(req);
    const course = await prisma.course.findUniqueOrThrow({
      where: { id: params.id },
      select: { id: true, slug: true, title: true, priceCents: true },
    });
    return Response.json(course);
  } catch (err) {
    return unauthorizedResponse(err);
  }
}
