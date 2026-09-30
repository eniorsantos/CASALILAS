"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Cancela assinatura localmente (acesso vale até currentPeriodEnd).
 * Também cancele no dashboard do gateway (Stripe/MP) para parar a cobrança.
 */
export async function cancelSubscription(subscriptionId: string) {
  await requireRole(["ADMIN"]);
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: "CANCELED", canceledAt: new Date() },
  });
  revalidatePath("/admin/financeiro");
  return { success: true };
}
