export const dynamic = "force-dynamic";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signMobileToken, unauthorizedResponse } from "@/lib/mobile-auth";

export async function POST(req: Request) {
  try {
    const { name, email, password } = (await req.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };
    if (!name || name.trim().length < 2) return new Response("Nome inválido", { status: 400 });
    if (!email || !email.includes("@")) return new Response("Email inválido", { status: 400 });
    if (!password || password.length < 8)
      return new Response("A senha precisa de ao menos 8 caracteres", { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return new Response("Este email já está cadastrado", { status: 409 });

    const user = await prisma.user.create({
      data: { name: name.trim(), email, passwordHash: await bcrypt.hash(password, 12), role: "STUDENT" },
    });
    const token = signMobileToken({ id: user.id, role: user.role });
    return Response.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    return unauthorizedResponse(err);
  }
}
