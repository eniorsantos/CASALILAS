import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { queueCertificateCheck } from "@/lib/queue/producers/certificate";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Não autorizado", { status: 401 });
  const userId = (user as { id: string }).id;
  const { watchedSeconds } = await req.json();

  const lesson = await prisma.lesson.findUniqueOrThrow({
    where: { id: params.id },
    include: { module: true },
  });

  const completed = lesson.durationSecs ? watchedSeconds / lesson.durationSecs >= 0.9 : false;

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId: lesson.id } },
    create: { userId, lessonId: lesson.id, watchedSeconds, completed },
    update: { watchedSeconds, completed, completedAt: completed ? new Date() : undefined },
  });

  if (completed) {
    await queueCertificateCheck(userId, lesson.module.courseId);
  }

  return Response.json({ ok: true });
}
