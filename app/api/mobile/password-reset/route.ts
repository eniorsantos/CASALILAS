export const dynamic = "force-dynamic";

import { requestPasswordReset } from "@/app/(auth)/recuperar-senha/actions";
import { unauthorizedResponse } from "@/lib/mobile-auth";

/** Reaproveita o fluxo web (resposta idêntica exista ou não o email). */
export async function POST(req: Request) {
  try {
    const { email } = (await req.json()) as { email?: string };
    if (email) await requestPasswordReset(email);
    return Response.json({ success: true });
  } catch (err) {
    return unauthorizedResponse(err);
  }
}
