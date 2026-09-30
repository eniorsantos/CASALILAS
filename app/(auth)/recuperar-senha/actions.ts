"use server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { emailQueue } from "@/lib/queue/queues";

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { success: true };

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 1000 * 60 * 30),
    },
  });

  await emailQueue.add("password-reset-email", {
    email: user.email,
    resetUrl: `${process.env.APP_URL}/redefinir-senha?token=${token}`,
  });

  return { success: true };
}
