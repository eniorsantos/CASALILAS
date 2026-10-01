export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CourseTile, SectionTitle, StudentNav, TileRow } from "@/components/streaming";

export default async function MyCoursesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/meus-cursos");
  const userId = (user as { id: string }).id;

  const enrollments = await prisma.enrollment.findMany({
    where: { userId, status: "ACTIVE" },
    include: {
      course: { include: { modules: { include: { lessons: { select: { id: true } } } } } },
    },
  });
  const subscriptions = await prisma.subscription.findMany({
    where: { userId, status: "ACTIVE" },
    include: { plan: true },
  });

  const withProgress = await Promise.all(
    enrollments.map(async (e) => {
      const lessonIds = e.course.modules.flatMap((m) => m.lessons.map((l) => l.id));
      const completed = lessonIds.length
        ? await prisma.lessonProgress.count({
            where: { userId, lessonId: { in: lessonIds }, completed: true },
          })
        : 0;
      return {
        enrollment: e,
        progressPercent: lessonIds.length ? Math.round((completed / lessonIds.length) * 100) : 0,
      };
    })
  );

  return (
    <div className="theme-streaming min-h-screen bg-st-bg text-st-text">
      <StudentNav />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-6">
        <h1 className="font-display text-3xl tracking-wide">MEUS CURSOS</h1>
        {subscriptions.length > 0 && (
          <p className="mt-1 inline-block rounded-sm bg-st-accent-warm px-2 py-0.5 text-[10px] font-extrabold text-[#2A2033]">
            ASSINATURA ATIVA: {subscriptions[0].plan.name.toUpperCase()}
          </p>
        )}
        <section className="mt-4">
          <SectionTitle>Continue assistindo</SectionTitle>
          <TileRow>
            {withProgress.map(({ enrollment: e, progressPercent }, i) => (
              <CourseTile
                key={e.id}
                href={`/curso/${e.course.slug}`}
                title={e.course.title}
                thumbnailUrl={e.course.thumbnailUrl}
                progressPercent={progressPercent}
                gradientIndex={i}
              />
            ))}
          </TileRow>
          {enrollments.length === 0 && (
            <p className="mt-4 text-sm text-st-dim">
              Você ainda não está matriculado em nenhum curso.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
