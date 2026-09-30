export const dynamic = "force-dynamic";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signMobileToken, unauthorizedResponse } from "@/lib/mobile-auth";

/** Login mobile via JWT (nunca cookie) — spec §6.2. Reaproveita a lógica do authorize(). */
export async function POST(req: Request) {
  try {
    const { email, password } = (await req.json()) as { email?: string; password?: string };
    if (!email || !password) return new Response("Credenciais inválidas", { status: 401 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) return new Response("Credenciais inválidas", { status: 401 });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return new Response("Credenciais inválidas", { status: 401 });

    const token = signMobileToken({ id: user.id, role: user.role });
    return Response.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    return unauthorizedResponse(err);
  }
}
