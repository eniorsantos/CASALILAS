import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import {
  createModule,
  reorderModules,
  createLesson,
  updateModuleTitle,
  toggleFreePreview,
  revokeEnrollment,
} from "@/app/(admin)/admin/cursos/[id]/actions";

vi.mock("@/lib/auth", () => ({
  requireRole: vi.fn(),
  getCurrentUser: vi.fn(),
}));

// revalidatePath exige request scope do Next — mocka em testes unitários.
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

const mockRequireRole = vi.mocked(requireRole);

async function makeInstructor(email: string) {
  return prisma.user.create({ data: { name: email, email, role: "INSTRUCTOR" } });
}

async function makeCourse(instructorId: string, slug: string) {
  return prisma.course.create({
    data: {
      title: `Curso ${slug}`,
      slug,
      description: "Descrição válida com mais de 10 caracteres",
      priceCents: 1000,
      instructorId,
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("currículo do curso (módulos e aulas)", () => {
  it("createModule numera em sequência", async () => {
    const instructor = await makeInstructor("mod1@test.com");
    mockRequireRole.mockResolvedValue(instructor as never);
    const course = await makeCourse(instructor.id, "mod-seq");

    await createModule(course.id, "Módulo 1");
    await createModule(course.id, "Módulo 2");

    const modules = await prisma.module.findMany({
      where: { courseId: course.id },
      orderBy: { order: "asc" },
    });
    expect(modules).toHaveLength(2);
    expect(modules[0].order).toBeLessThan(modules[1].order);
  });

  it("reorderModules aplica a nova ordem atomicamente", async () => {
    const instructor = await makeInstructor("mod2@test.com");
    mockRequireRole.mockResolvedValue(instructor as never);
    const course = await makeCourse(instructor.id, "mod-reorder");

    await createModule(course.id, "A");
    await createModule(course.id, "B");
    const before = await prisma.module.findMany({
      where: { courseId: course.id },
      orderBy: { order: "asc" },
    });

    const result = await reorderModules(course.id, [before[1].id, before[0].id]);
    expect(result).toEqual({ success: true });

    const after = await prisma.module.findMany({
      where: { courseId: course.id },
      orderBy: { order: "asc" },
    });
    expect(after.map((m) => m.id)).toEqual([before[1].id, before[0].id]);
  });

  it("instrutor não reordena módulos de curso alheio", async () => {
    const owner = await makeInstructor("owner@test.com");
    const intruder = await makeInstructor("intruder@test.com");
    const course = await makeCourse(owner.id, "mod-alheio");
    mockRequireRole.mockResolvedValue(owner as never);
    await createModule(course.id, "Único");

    mockRequireRole.mockResolvedValue(intruder as never);
    await expect(reorderModules(course.id, [])).rejects.toThrow(
      "Você não tem permissão para editar este curso"
    );
  });

  it("updateModuleTitle valida título curto", async () => {
    const instructor = await makeInstructor("mod3@test.com");
    mockRequireRole.mockResolvedValue(instructor as never);
    const course = await makeCourse(instructor.id, "mod-title");
    await createModule(course.id, "Original");
    const mod = await prisma.module.findFirstOrThrow({ where: { courseId: course.id } });

    const bad = await updateModuleTitle(mod.id, "X");
    expect(bad.error).toBeDefined();

    const ok = await updateModuleTitle(mod.id, "Renomeado");
    expect(ok).toEqual({ success: true });
    const updated = await prisma.module.findUniqueOrThrow({ where: { id: mod.id } });
    expect(updated.title).toBe("Renomeado");
  });

  it("createLesson numera em sequência e retorna sucesso", async () => {
    const instructor = await makeInstructor("les1@test.com");
    mockRequireRole.mockResolvedValue(instructor as never);
    const course = await makeCourse(instructor.id, "les-seq");
    await createModule(course.id, "M1");
    const mod = await prisma.module.findFirstOrThrow({ where: { courseId: course.id } });

    const r1 = await createLesson(mod.id, "Aula 1", "VIDEO");
    const r2 = await createLesson(mod.id, "Aula 2", "VIDEO");
    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);

    const lessons = await prisma.lesson.findMany({
      where: { moduleId: mod.id },
      orderBy: { order: "asc" },
    });
    expect(lessons.map((l) => l.title)).toEqual(["Aula 1", "Aula 2"]);
  });

  it("toggleFreePreview alterna o preview da aula", async () => {
    const instructor = await makeInstructor("les2@test.com");
    mockRequireRole.mockResolvedValue(instructor as never);
    const course = await makeCourse(instructor.id, "les-preview");
    await createModule(course.id, "M1");
    const mod = await prisma.module.findFirstOrThrow({ where: { courseId: course.id } });
    await createLesson(mod.id, "Aula grátis?", "VIDEO");
    const lesson = await prisma.lesson.findFirstOrThrow({ where: { moduleId: mod.id } });
    expect(lesson.isFreePreview).toBe(false);

    await toggleFreePreview(lesson.id, true);
    const updated = await prisma.lesson.findUniqueOrThrow({ where: { id: lesson.id } });
    expect(updated.isFreePreview).toBe(true);
  });

  it("instrutor não alterna preview de aula alheia", async () => {
    const owner = await makeInstructor("les-owner@test.com");
    const intruder = await makeInstructor("les-intruder@test.com");
    const course = await makeCourse(owner.id, "les-alheia");
    mockRequireRole.mockResolvedValue(owner as never);
    await createModule(course.id, "M1");
    const mod = await prisma.module.findFirstOrThrow({ where: { courseId: course.id } });
    await createLesson(mod.id, "Aula", "VIDEO");
    const lesson = await prisma.lesson.findFirstOrThrow({ where: { moduleId: mod.id } });

    mockRequireRole.mockResolvedValue(intruder as never);
    await expect(toggleFreePreview(lesson.id, true)).rejects.toThrow(
      "Você não tem permissão para editar este curso"
    );
  });
});

describe("revogar matrícula", () => {
  it("admin revoga acesso (CANCELED)", async () => {
    const admin = await prisma.user.create({
      data: { name: "Admin", email: "admin@test.com", role: "ADMIN" },
    });
    const student = await prisma.user.create({
      data: { name: "Aluno", email: "aluno-rev@test.com", role: "STUDENT" },
    });
    const instructor = await makeInstructor("rev-inst@test.com");
    const course = await makeCourse(instructor.id, "rev-curso");
    const enrollment = await prisma.enrollment.create({
      data: { userId: student.id, courseId: course.id, status: "ACTIVE" },
    });

    mockRequireRole.mockResolvedValue(admin as never);
    const result = await revokeEnrollment(enrollment.id);
    expect(result).toEqual({ success: true });

    const updated = await prisma.enrollment.findUniqueOrThrow({ where: { id: enrollment.id } });
    expect(updated.status).toBe("CANCELED");
  });

  it("instrutor não pode revogar (só ADMIN)", async () => {
    const instructor = await makeInstructor("rev-inst2@test.com");
    const student = await prisma.user.create({
      data: { name: "Aluno2", email: "aluno-rev2@test.com", role: "STUDENT" },
    });
    const course = await makeCourse(instructor.id, "rev-curso2");
    const enrollment = await prisma.enrollment.create({
      data: { userId: student.id, courseId: course.id, status: "ACTIVE" },
    });

    mockRequireRole.mockRejectedValue(new Error("Não autorizado"));
    await expect(revokeEnrollment(enrollment.id)).rejects.toThrow("Não autorizado");
  });
});
