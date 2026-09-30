export const dynamic = "force-dynamic";

import Mux from "@mux/mux-node";
import { prisma } from "@/lib/prisma";
import { hasAccessToCourse } from "@/lib/access";
import { getTokenUser, unauthorizedResponse } from "@/lib/mobile-auth";
import { getSignedMp4Url } from "@/lib/mux-signed-url";

/**
 * URL mp4 estática p/ download offline: resolve o asset no Mux, pega a
 * rendition estática pronta e assina. 404 se ainda estiver processando.
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = getTokenUser(req);
    const lesson = await prisma.lesson.findUniqueOrThrow({
      where: { id: params.id },
      include: { module: true },
    });
    const access = await hasAccessToCourse(user.id, lesson.module.courseId);
    if (!access && !lesson.isFreePreview) {
      return new Response("Sem acesso a esta aula", { status: 403 });
    }
    if (!lesson.videoAssetId) return new Response("Vídeo não disponível", { status: 404 });

    const mux = new Mux({
      tokenId: process.env.MUX_TOKEN_ID!,
      tokenSecret: process.env.MUX_TOKEN_SECRET!,
    });
    const asset = await mux.video.assets.retrieve(lesson.videoAssetId);
    const playbackId =
      lesson.playbackId ?? asset.playback_ids?.[0]?.id;
    const mp4 = asset.static_renditions?.files
      ?.filter((f) => f.name?.endsWith(".mp4"))
      .sort((a, b) => (b.height ?? 0) - (a.height ?? 0))[0];

    if (!playbackId || asset.static_renditions?.status !== "ready" || !mp4?.name) {
      return new Response(
        "Versão offline ainda não pronta — ative Static Renditions no Mux e aguarde o processamento",
        { status: 404 }
      );
    }

    return Response.json({ url: getSignedMp4Url(playbackId, mp4.name) });
  } catch (err) {
    return unauthorizedResponse(err);
  }
}
