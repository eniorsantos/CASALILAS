export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getTokenUser, unauthorizedResponse } from "@/lib/mobile-auth";

/** Registra/atualiza o Expo Push token do device (um usuário, vários devices). */
export async function POST(req: Request) {
  try {
    const user = getTokenUser(req);
    const { token, platform } = (await req.json()) as { token?: string; platform?: string };
    if (!token) return new Response("Token ausente", { status: 400 });

    await prisma.pushToken.upsert({
      where: { token },
      update: { userId: user.id, platform: platform ?? "unknown" },
      create: { userId: user.id, token, platform: platform ?? "unknown" },
    });
    return Response.json({ success: true });
  } catch (err) {
    return unauthorizedResponse(err);
  }
}
