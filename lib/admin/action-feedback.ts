"use client";

import { toast } from "sonner";

type ActionResult =
  | { success?: boolean; error?: string | Record<string, string[]>; courseId?: string }
  | { error: string };

/**
 * Padrão único de feedback para Server Actions (seção 11).
 * Nunca tratar erro de action de forma ad-hoc por tela.
 */
export async function handleAction(
  action: () => Promise<ActionResult>,
  successMessage: string
): Promise<boolean> {
  const result = await action();
  if (result && "error" in result && result.error) {
    const message =
      typeof result.error === "string" ? result.error : "Verifique os campos destacados";
    toast.error(message);
    return false;
  }
  toast.success(successMessage);
  return true;
}
