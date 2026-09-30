export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { hasAccessToCourse } from "@/lib/access";
import { getTokenUser, unauthorizedResponse } from "@/lib/mobile-auth";

/** Checagem de acesso de uma aula (usada pelo player e pela validação offline). */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = getTokenUser(req);
    const lesson = await prisma.lesson.findUniqueOrThrow({
      where: { id: params.id },
      include: { module: true },
    });
    const access = await hasAccessToCourse(user.id, lesson.module.courseId);
    return Response.json({
      hasAccess: access,
      isFreePreview: lesson.isFreePreview,
      courseId: lesson.module.courseId,
    });
  } catch (err) {
    return unauthorizedResponse(err);
  }
}
