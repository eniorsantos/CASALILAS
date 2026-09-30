import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}

/**
 * Proxy que adia a construção do PrismaClient para o primeiro USO
 * (em vez do import). Motivo: o Prisma lê DATABASE_URL na construção;
 * nos testes (Testcontainers), a URL do banco de teste só é definida no
 * setup do Vitest — DEPOIS que os imports já foram avaliados. Sem isso,
 * o client prendia a URL do .env local e os testes nunca atingiam o
 * banco isolado (além de disputarem o Postgres local entre arquivos).
 * Em produção/dev o comportamento é idêntico (env já carregado no boot).
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    const value = (getClient() as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") {
      return (...args: unknown[]) =>
        (value as (...a: unknown[]) => unknown).apply(getClient(), args);
    }
    return value;
  },
});
