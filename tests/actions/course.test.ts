import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { createCourse } from "@/app/(admin)/admin/cursos/actions";

vi.mock("@/lib/auth", () => ({
  requireRole: vi.fn(),
}));

// revalidatePath exige request scope do Next — mocka em testes unitários.
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// tests/setup.ts faz resetAllMocks() a cada teste — restabelece o mock aqui.
beforeEach(() => {
  vi.mocked(requireRole).mockResolvedValue({ id: "user_1", role: "INSTRUCTOR" } as never);
});

describe("createCourse", () => {
  it("cria um curso com dados válidos", async () => {
    // instructorId precisa existir (FK enforced) — cria o usuário antes.
    const instructor = await prisma.user.create({
      data: { id: "user_1", name: "Prof", email: "prof@test.com", role: "INSTRUCTOR" },
    });
    vi.mocked(requireRole).mockResolvedValue(instructor as never);

    const formData = new FormData();
    formData.set("title", "Curso de TypeScript");
    formData.set("description", "Aprenda TypeScript do zero ao avançado");
    formData.set("priceCents", "9900");

    const result = await createCourse(formData);

    expect(result.success).toBe(true);
    const course = await prisma.course.findUnique({ where: { id: result.courseId } });
    expect(course?.slug).toBe("curso-de-typescript");
    expect(course?.status).toBe("DRAFT");
  });

  it("rejeita título muito curto", async () => {
    const formData = new FormData();
    formData.set("title", "Ab");
    formData.set("description", "Descrição válida com mais de 10 caracteres");
    formData.set("priceCents", "9900");

    const result = await createCourse(formData);
    expect((result.error as Record<string, string[]>)?.title?.[0]).toContain("Título muito curto");
  });

  it("rejeita preço negativo", async () => {
    const formData = new FormData();
    formData.set("title", "Curso Válido");
    formData.set("description", "Descrição válida com mais de 10 caracteres");
    formData.set("priceCents", "-100");

    const result = await createCourse(formData);
    expect((result.error as Record<string, string[]>)?.priceCents).toBeDefined();
  });
});
