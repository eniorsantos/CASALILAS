// Seed do admin para deploy local em produção.
// Uso: $env:DATABASE_URL="..." ; $env:ADMIN_NAME="..." ; $env:ADMIN_EMAIL="..." ; $env:ADMIN_PASSWORD="..."
//      npx tsx scripts/seed-admin.ts
// Lê tudo de env — nenhum segredo fica no código. Apague as vars após usar.
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

async function main(): Promise<void> {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("Defina ADMIN_NAME, ADMIN_EMAIL e ADMIN_PASSWORD no ambiente");
  }
  if (ADMIN_PASSWORD.length < 8) throw new Error("ADMIN_PASSWORD precisa de ao menos 8 caracteres");

  const user = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { name: ADMIN_NAME, passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12), role: "ADMIN" },
    create: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12),
      role: "ADMIN",
    },
  });
  console.log(`ADMIN OK: ${user.email} (${user.role})`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("SEED_ERROR:" + (e as Error).message);
  process.exit(1);
});
