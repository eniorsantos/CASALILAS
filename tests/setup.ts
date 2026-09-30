import "@testing-library/jest-dom";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { execSync } from "child_process";
import { beforeAll, afterAll, beforeEach, vi } from "vitest";

let container: StartedPostgreSqlContainer;

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:16").start();
  process.env.DATABASE_URL = container.getConnectionUri();
  execSync("npx prisma migrate deploy", { env: process.env, stdio: "inherit" });
}, 120_000);

afterAll(async () => {
  await container.stop();
});

beforeEach(async () => {
  vi.resetAllMocks();
  const { prisma } = await import("@/lib/prisma");
  const tables = ["lesson_progress", "enrollments", "payments", "lessons", "modules", "courses", "users"];
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
    } catch {
      // ignora se tabela ainda não existe
    }
  }
});
