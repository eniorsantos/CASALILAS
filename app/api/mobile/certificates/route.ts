export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getTokenUser, unauthorizedResponse } from "@/lib/mobile-auth";

/** Certificados do usuário (spec §6). */
export async function GET(req: Request) {
  try {
    const user = getTokenUser(req);
    const certs = await prisma.certificate.findMany({
      where: { userId: user.id },
      include: { course: true },
      orderBy: { issuedAt: "desc" },
    });
    return Response.json(
      certs.map((c) => ({
        id: c.id,
        courseTitle: c.course.title,
        certificateUrl: c.certificateUrl,
        verificationHash: c.verificationHash,
        issuedAt: c.issuedAt,
      }))
    );
  } catch (err) {
    return unauthorizedResponse(err);
  }
}
