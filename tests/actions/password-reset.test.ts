import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetPassword } from "@/app/(auth)/redefinir-senha/actions";
import bcrypt from "bcryptjs";

describe("resetPassword", () => {
  it("redefine a senha com token válido", async () => {
    const user = await prisma.user.create({
      data: { name: "Teste", email: "teste@test.com", passwordHash: "hash-antigo" },
    });
    await prisma.passwordResetToken.create({
      data: { userId: user.id, token: "token-valido", expiresAt: new Date(Date.now() + 60000) },
    });

    const result = await resetPassword("token-valido", "novaSenha123");

    expect(result.success).toBe(true);
    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    const senhaValida = await bcrypt.compare("novaSenha123", updated!.passwordHash!);
    expect(senhaValida).toBe(true);
  });

  it("rejeita token expirado", async () => {
    const user = await prisma.user.create({ data: { name: "T", email: "t2@test.com" } });
    await prisma.passwordResetToken.create({
      data: { userId: user.id, token: "token-expirado", expiresAt: new Date(Date.now() - 1000) },
    });

    const result = await resetPassword("token-expirado", "novaSenha123");
    expect(result.error).toBe("Link inválido ou expirado. Solicite um novo.");
  });

  it("rejeita reutilização do mesmo token", async () => {
    const user = await prisma.user.create({ data: { name: "T", email: "t3@test.com" } });
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: "token-usado",
        expiresAt: new Date(Date.now() + 60000),
        usedAt: new Date(),
      },
    });

    const result = await resetPassword("token-usado", "outraSenha123");
    expect(result.error).toBeDefined();
  });
});
