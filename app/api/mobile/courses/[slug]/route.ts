export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { hasAccessToCourse } from "@/lib/access";
import { getTokenUser, unauthorizedResponse } from "@/lib/mobile-auth";

/** Detalhe do curso: módulos/aulas, acesso, progresso e relacionados. */
export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const user = getTokenUser(req);
    const course = await prisma.course.findUniqueOrThrow({
      where: { slug: params.slug },
      include: {
        instructor: { select: { name: true } },
        modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } },
      },
    });

    const [hasAccess, completedIds, related] = await Promise.all([
      hasAccessToCourse(user.id, course.id),
      prisma.lessonProgress
        .findMany({
          where: {
            userId: user.id,
            completed: true,
            lesson: { module: { courseId: course.id } },
          },
          select: { lessonId: true },
        })
        .then((rows) => new Set(rows.map((r) => r.lessonId))),
      prisma.course.findMany({
        where: { status: "PUBLISHED", id: { not: course.id } },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);

    return Response.json({
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      thumbnailUrl: course.thumbnailUrl ?? "",
      priceCents: course.priceCents,
      category: course.category,
      instructorName: course.instructor.name,
      hasAccess,
      modules: course.modules.map((m) => ({
        id: m.id,
        title: m.title,
        lessons: m.lessons.map((l) => ({
          id: l.id,
          title: l.title,
          type: l.type,
          durationSecs: l.durationSecs,
          isFreePreview: l.isFreePreview,
          completed: completedIds.has(l.id),
        })),
      })),
      related: related.map((c) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        thumbnailUrl: c.thumbnailUrl ?? "",
      })),
    });
  } catch (err) {
    return unauthorizedResponse(err);
  }
}
