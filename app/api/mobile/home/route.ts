export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getTokenUser, unauthorizedResponse } from "@/lib/mobile-auth";

/**
 * Home agregada p/ mobile: 1 chamada retorna hero + carrosséis (spec §6.1).
 * Evita 5-6 requisições em rede móvel.
 */
export async function GET(req: Request) {
  try {
    const user = getTokenUser(req);

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      include: {
        course: { include: { modules: { include: { lessons: true } } } },
      },
    });
    const enrolledIds = enrollments.map((e) => e.courseId);

    const [recommended, recent] = await Promise.all([
      prisma.course.findMany({
        where: { status: "PUBLISHED", id: { notIn: enrolledIds } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.course.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    const progressByCourse = await Promise.all(
      enrollments.map(async (e) => {
        const lessonIds = e.course.modules.flatMap((m) => m.lessons.map((l) => l.id));
        const completed = lessonIds.length
          ? await prisma.lessonProgress.count({
              where: { userId: user.id, lessonId: { in: lessonIds }, completed: true },
            })
          : 0;
        const nextLesson = e.course.modules
          .flatMap((m) => m.lessons)
          .sort((a, b) => a.order - b.order)[completed];
        return {
          id: e.course.id,
          slug: e.course.slug,
          title: e.course.title,
          thumbnailUrl: e.course.thumbnailUrl ?? "",
          progressPercent: lessonIds.length ? Math.round((completed / lessonIds.length) * 100) : 0,
          lessonId: nextLesson?.id,
        };
      })
    );

    const toCarousel = (c: { id: string; slug: string; title: string; thumbnailUrl: string | null }) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      thumbnailUrl: c.thumbnailUrl ?? "",
    });

    const heroCourse = recommended[0] ?? recent[0] ?? null;

    // Seções dinâmicas por categoria (cursos com category preenchida).
    const categories = await prisma.course.groupBy({
      by: ["category"],
      where: { status: "PUBLISHED", category: { not: null } },
    });
    const categorySections = await Promise.all(
      categories
        .filter((c) => c.category)
        .slice(0, 5)
        .map(async (c) => {
          const items = await prisma.course.findMany({
            where: { status: "PUBLISHED", category: c.category! },
            orderBy: { createdAt: "desc" },
            take: 10,
          });
          return { title: c.category!, courses: items.map(toCarousel) };
        })
    );

    return Response.json({
      hero: heroCourse
        ? {
            courseId: heroCourse.id,
            slug: heroCourse.slug,
            title: heroCourse.title,
            bannerUrl: heroCourse.thumbnailUrl ?? "",
            description: heroCourse.description,
            meta: "Curso · Certificado incluso",
            lessonId: progressByCourse.find((p) => p.id === heroCourse.id)?.lessonId,
          }
        : null,
      sections: [
        { title: "Continue assistindo", courses: progressByCourse.filter((p) => (p.progressPercent ?? 0) > 0) },
        { title: "Recomendados para você", courses: recommended.map(toCarousel) },
        ...categorySections,
        { title: "Novidades", courses: recent.map(toCarousel) },
        { title: "Meus cursos", courses: progressByCourse },
      ],
    });
  } catch (err) {
    return unauthorizedResponse(err);
  }
}
