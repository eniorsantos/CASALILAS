export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasAccessToCourse } from "@/lib/access";
import { VideoPlayer } from "@/components/VideoPlayer";
import { redirect } from "next/navigation";

export default async function CoursePage({ params }: { params: { slug: string } }) {
  const course = await prisma.course.findUniqueOrThrow({
    where: { slug: params.slug },
    include: { modules: { orderBy: { order: "asc" }, include: { lessons: { orderBy: { order: "asc" } } } } },
  });
  const user = await getCurrentUser();
  const userId = (user as { id: string } | null)?.id;
  const hasAccess = userId ? await hasAccessToCourse(userId, course.id) : false;
  const firstLesson = course.modules[0]?.lessons[0];

  return (
    <main className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold">{course.title}</h1>
      <p className="text-gray-600 mt-2">{course.description}</p>
      {!hasAccess && (
        <div className="mt-4 p-4 border rounded bg-yellow-50">
          <p>Você ainda não tem acesso a este curso.</p>
          <form
            action={async () => {
              "use server";
              redirect(`/checkout/${course.slug}`);
            }}
          >
            <button className="mt-2 bg-black text-white px-4 py-2 rounded">Comprar acesso</button>
          </form>
        </div>
      )}
      {course.modules.map((m) => (
        <div key={m.id} className="mt-6">
          <h2 className="font-bold">{m.title}</h2>
          <ul className="mt-2 space-y-1">
            {m.lessons.map((l) => (
              <li key={l.id} className="border rounded p-2 bg-white flex justify-between">
                <span>{l.title} {l.isFreePreview && "(grátis)"}</span>
                {(hasAccess || l.isFreePreview) && firstLesson?.id === l.id ? null : null}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {firstLesson && (hasAccess || firstLesson.isFreePreview) && (
        <div className="mt-8">
          <VideoPlayer lessonId={firstLesson.id} />
        </div>
      )}
    </main>
  );
}
