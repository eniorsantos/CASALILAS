export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getTokenUser, unauthorizedResponse } from "@/lib/mobile-auth";

/** Catálogo publicado com busca (?q=). */
export async function GET(req: Request) {
  try {
    getTokenUser(req);
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";

    const courses = await prisma.course.findMany({
      where: {
        status: "PUBLISHED",
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return Response.json(
      courses.map((c) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        thumbnailUrl: c.thumbnailUrl ?? "",
      }))
    );
  } catch (err) {
    return unauthorizedResponse(err);
  }
}
