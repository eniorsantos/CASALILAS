import { describe, it, expect, vi } from "vitest";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/auth", () => ({
  requireRole: vi.fn(),
}));

import { requireRole } from "@/lib/auth";
import { updateCourse } from "@/app/(admin)/admin/cursos/actions";

describe("proteção de propriedade de curso", () => {
  it("instrutor não pode editar curso de outro instrutor", async () => {
    const instructorA = await prisma.user.create({
      data: { name: "A", email: "a@test.com", role: "INSTRUCTOR" },
    });
    const instructorB = await prisma.user.create({
      data: { name: "B", email: "b@test.com", role: "INSTRUCTOR" },
    });
    const course = await prisma.course.create({
      data: {
        title: "Curso do A",
        slug: "curso-do-a",
        description: "descricao valida",
        priceCents: 1000,
        instructorId: instructorA.id,
      },
    });

    vi.mocked(requireRole).mockResolvedValue(instructorB as never);

    const formData = new FormData();
    formData.set("title", "Tentando editar");
    formData.set("description", "descrição qualquer com mais de 10 caracteres");
    formData.set("priceCents", "2000");

    await expect(updateCourse(course.id, formData)).rejects.toThrow(
      "Você não tem permissão para editar este curso"
    );
  });
});
