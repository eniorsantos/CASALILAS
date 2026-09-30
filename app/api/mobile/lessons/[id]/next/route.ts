export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getTokenUser, unauthorizedResponse } from "@/lib/mobile-auth";

/** Próxima aula na ordem do curso (auto-play "próximo episódio"). Null se acabou. */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    getTokenUser(req);
    const current = await prisma.lesson.findUniqueOrThrow({
      where: { id: params.id },
      include: {
        module: {
          include: {
            course: {
              include: {
                modules: {
                  orderBy: { order: "asc" },
                  include: { lessons: { orderBy: { order: "asc" } } },
                },
              },
            },
          },
        },
      },
    });

    const ordered = current.module.course.modules.flatMap((m) => m.lessons);
    const idx = ordered.findIndex((l) => l.id === params.id);
    const next = idx >= 0 ? ordered[idx + 1] ?? null : null;

    return Response.json(
      next ? { id: next.id, title: next.title, type: next.type } : null
    );
  } catch (err) {
    return unauthorizedResponse(err);
  }
}
