import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasAccessToCourse } from "@/lib/access";
import { getSignedPlaybackUrl } from "@/lib/mux-signed-url";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Não autorizado", { status: 401 });
  const lesson = await prisma.lesson.findUniqueOrThrow({
    where: { id: params.id },
    include: { module: true },
  });

  const access = await hasAccessToCourse((user as { id: string }).id, lesson.module.courseId);
  if (!access && !lesson.isFreePreview) {
    return new Response("Sem acesso a esta aula", { status: 403 });
  }
  if (!lesson.videoAssetId && !lesson.playbackId) {
    return new Response("Vídeo não disponível", { status: 404 });
  }

  // playbackId (novo) tem precedência; videoAssetId legado pode já ser o playback.
  const url = getSignedPlaybackUrl(lesson.playbackId ?? lesson.videoAssetId!);
  return Response.json({ url });
}
