export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { signMobileToken, unauthorizedResponse } from "@/lib/mobile-auth";
import * as jose from "jose";

async function verifyGoogle(idToken: string): Promise<{ email: string; name: string }> {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
  if (!res.ok) throw Object.assign(new Error("Google: token inválido"), { status: 401 });
  const data = (await res.json()) as { aud?: string; email?: string; name?: string; email_verified?: string };
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (clientId && !clientId.includes("dummy") && data.aud !== clientId) {
    throw Object.assign(new Error("Google: audiência inválida"), { status: 401 });
  }
  if (!data.email) throw Object.assign(new Error("Google: sem email"), { status: 401 });
  return { email: data.email, name: data.name ?? data.email.split("@")[0] };
}

const APPLE_JWKS = jose.createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

async function verifyApple(
  idToken: string,
  fallback: { email?: string; name?: string }
): Promise<{ email: string; name: string }> {
  // Em dev sem APPLE_CLIENT_ID, pula a checagem de audiência (nunca em produção).
  const audience = process.env.APPLE_CLIENT_ID;
  const { payload } = await jose.jwtVerify(idToken, APPLE_JWKS, {
    issuer: "https://appleid.apple.com",
    ...(audience ? { audience } : {}),
  }).catch(() => {
    throw Object.assign(new Error("Apple: token inválido"), { status: 401 });
  });
  const email = fallback.email ?? (payload.email as string | undefined);
  if (!email) {
    throw Object.assign(new Error("Apple: email não compartilhado — use login por email"), {
      status: 400,
    });
  }
  return { email, name: fallback.name ?? (payload.email as string | undefined)?.split("@")[0] ?? "Aluno" };
}

/**
 * Login social mobile: troca idToken (Google/Apple) pelo nosso JWT 30d.
 * Vincula por email (conta existente com mesmo email é reaproveitada).
 */
export async function POST(req: Request) {
  try {
    const { provider, idToken, email, name } = (await req.json()) as {
      provider?: string;
      idToken?: string;
      email?: string;
      name?: string;
    };
    if (!idToken) return new Response("Token ausente", { status: 400 });

    const identity =
      provider === "apple"
        ? await verifyApple(idToken, { email, name })
        : provider === "google" || !provider
          ? await verifyGoogle(idToken)
          : null;
    if (!identity) return new Response("Provedor inválido", { status: 400 });

    const user = await prisma.user.upsert({
      where: { email: identity.email },
      update: { name: identity.name },
      create: { name: identity.name, email: identity.email, role: "STUDENT" },
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
