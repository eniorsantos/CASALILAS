export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasAccessToCourse } from "@/lib/access";
import { VideoPlayer } from "@/components/VideoPlayer";
import { redirect } from "next/navigation";
import { CourseTile, SectionTitle, StudentNav, TileRow } from "@/components/streaming";

export default async function CoursePage({ params }: { params: { slug: string } }) {
  const course = await prisma.course.findUniqueOrThrow({
    where: { slug: params.slug },
    include: { modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } } },
  });
  const user = await getCurrentUser();
  const userId = (user as { id: string } | null)?.id;
  const hasAccess = userId ? await hasAccessToCourse(userId, course.id) : false;
  const firstLesson = course.modules[0]?.lessons[0];
  const totalLessons = course.modules.flatMap((m) => m.lessons).length;
  const related = await prisma.course.findMany({
    where: { status: "PUBLISHED", id: { not: course.id } },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return (
    <div className="theme-streaming min-h-screen bg-st-bg text-st-text">
      <StudentNav />
      <main className="mx-auto max-w-5xl px-4 pb-16">
        <section className="relative -mx-4 flex h-[220px] items-end overflow-hidden bg-gradient-to-br from-[#4A3F91] to-[#1E1830] px-4 pb-4 md:mx-0 md:mt-4 md:rounded-lg">
          {course.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={course.thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-st-bg" />
          <h1 className="relative z-10 font-display text-4xl leading-none">{course.title}</h1>
        </section>

        <div className="mt-3 flex gap-2 text-[11px] text-st-dim">
          <span>{totalLessons} aulas</span>
          <span>·</span>
          <span>Certificado incluso</span>
          {course.category ? (
            <>
              <span>·</span>
              <span>{course.category}</span>
            </>
          ) : null}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-st-dim">{course.description}</p>

        {!hasAccess ? (
          <form
            action={async () => {
              "use server";
              redirect(`/checkout/${course.slug}`);
            }}
          >
            <button className="mt-4 w-full rounded bg-st-accent py-3 text-sm font-bold text-white">
              ▶ Assistir agora — R$ {(course.priceCents / 100).toFixed(2)}
            </button>
          </form>
        ) : (
          firstLesson && (
            <div className="mt-6">
              <VideoPlayer lessonId={firstLesson.id} />
            </div>
          )
        )}

        <div className="mt-6">
          {course.modules.map((m) => (
            <div key={m.id}>
              <div className="flex items-center justify-between border-b border-st-border py-2.5 text-xs">
                <span className="font-semibold text-st-text">{m.title}</span>
                <span className="text-st-dim">{m.lessons.length} aulas</span>
              </div>
              {m.lessons.map((l) => (
                <div key={l.id} className="flex items-center gap-2.5 py-2 text-[11px] text-st-dim">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-st-accent-warm" />
                  <span className="flex-1">
                    {l.title} {l.isFreePreview && "· grátis"}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {related.length > 0 && (
          <section className="mt-6">
            <SectionTitle>Cursos relacionados</SectionTitle>
            <TileRow>
              {related.map((c, i) => (
                <CourseTile
                  key={c.id}
                  href={`/curso/${c.slug}`}
                  title={c.title}
                  thumbnailUrl={c.thumbnailUrl}
                  gradientIndex={i}
                />
              ))}
            </TileRow>
          </section>
        )}
      </main>
    </div>
  );
}
