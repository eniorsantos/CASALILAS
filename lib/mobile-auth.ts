import jwt from "jsonwebtoken";

export interface TokenUser {
  id: string;
  role: string;
}

function getSecret(): string {
  // Fallback dummy só p/ build/dev sem credenciais; produção exige JWT_SECRET real.
  return process.env.JWT_SECRET ?? "dev-jwt-secret-change-me";
}

export function signMobileToken(user: { id: string; role: string }): string {
  return jwt.sign({ sub: user.id, role: user.role }, getSecret(), { expiresIn: "30d" });
}

/** Valida o Bearer token das rotas /api/mobile/*. Lança 401 se inválido. */
export function getTokenUser(req: Request): TokenUser {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw Object.assign(new Error("Não autorizado"), { status: 401 });
  try {
    const payload = jwt.verify(token, getSecret()) as { sub: string; role: string };
    return { id: payload.sub, role: payload.role };
  } catch {
    throw Object.assign(new Error("Sessão inválida"), { status: 401 });
  }
}

export function unauthorizedResponse(err: unknown): Response {
  const status = (err as { status?: number })?.status ?? 500;
  const message = status === 401 ? (err as Error).message : "Erro interno";
  return new Response(message, { status });
}
