import Mux from "@mux/mux-node";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

function getMux() {
  // Construído dentro do handler para não quebrar o `next build` sem credenciais.
  return new Mux({
    tokenId: process.env.MUX_TOKEN_ID ?? "dummy",
    tokenSecret: process.env.MUX_TOKEN_SECRET ?? "dummy",
  });
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole(["ADMIN", "INSTRUCTOR"]);
  } catch {
    return new Response("Não autorizado", { status: 401 });
  }
  const mux = getMux();
  const upload = await mux.video.uploads.create({
    cors_origin: process.env.APP_URL!,
    new_asset_settings: { playback_policy: ["signed"] },
  });

  await prisma.lesson.update({
    where: { id: params.id },
    data: { videoAssetId: upload.id },
  });

  return Response.json({ uploadUrl: upload.url });
}
