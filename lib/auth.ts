import { auth } from "@/auth";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireRole(allowedRoles: string[]) {
  const user = await getCurrentUser();
  if (!user || !allowedRoles.includes((user as { role?: string }).role ?? "")) {
    throw new Error("Não autorizado");
  }
  return user as { id: string; role: string; email: string; name: string };
}
