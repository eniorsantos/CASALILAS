import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  getCoursesForAdmin,
  getDashboardStats,
  getEnrollmentsForAdmin,
} from "@/lib/admin/queries";

vi.mock("@/lib/auth", () => ({
  requireRole: vi.fn(),
  getCurrentUser: vi.fn(),
}));

const mockGetCurrentUser = vi.mocked(getCurrentUser);

beforeEach(() => {
  vi.clearAllMocks();
});

async function makeInstructor(email: string) {
  return prisma.user.create({ data: { name: email, email, role: "INSTRUCTOR" } });
}

async function makeCourse(instructorId: string, slug: string, status: "DRAFT" | "PUBLISHED" = "PUBLISHED") {
  return prisma.course.create({
    data: {
      title: `Curso ${slug}`,
      slug,
      description: "Descrição válida com mais de 10 caracteres",
      priceCents: 5000,
      status,
      instructorId,
    },
  });
}

describe("getCoursesForAdmin", () => {
  it("instrutor vê só os próprios cursos, com contagem de alunos", async () => {
    const instructorA = await makeInstructor("qa@test.com");
    const instructorB = await makeInstructor("qb@test.com");
    const courseA = await makeCourse(instructorA.id, "qa-curso");
    await makeCourse(instructorB.id, "qb-curso");
    const student = await prisma.user.create({
      data: { name: "S", email: "qs@test.com", role: "STUDENT" },
    });
    await prisma.enrollment.create({
      data: { userId: student.id, courseId: courseA.id, status: "ACTIVE" },
    });

    mockGetCurrentUser.mockResolvedValue(instructorA as never);
    const rows = await getCoursesForAdmin();

    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(courseA.id);
    expect(rows[0].enrollmentCount).toBe(1);
  });

  it("admin vê todos os cursos", async () => {
    const admin = await prisma.user.create({
      data: { name: "Admin", email: "qadmin@test.com", role: "ADMIN" },
    });
    const instructor = await makeInstructor("qc@test.com");
    await makeCourse(instructor.id, "qc-1");
    await makeCourse(instructor.id, "qc-2");

    mockGetCurrentUser.mockResolvedValue(admin as never);
    const rows = await getCoursesForAdmin();
    expect(rows.length).toBeGreaterThanOrEqual(2);
  });

  it("aluno (STUDENT) não acessa", async () => {
    const student = await prisma.user.create({
      data: { name: "S", email: "qstudent@test.com", role: "STUDENT" },
    });
    mockGetCurrentUser.mockResolvedValue(student as never);
    await expect(getCoursesForAdmin()).rejects.toThrow("Não autorizado");
  });
});

describe("getDashboardStats", () => {
  it("agrega receita do mês, publicados e novos alunos", async () => {
    const instructor = await makeInstructor("qd@test.com");
    const course = await makeCourse(instructor.id, "qd-curso");
    const student = await prisma.user.create({
      data: { name: "S", email: "qd-aluno@test.com", role: "STUDENT" },
    });
    await prisma.payment.create({
      data: {
        userId: student.id,
        courseId: course.id,
        amountCents: 5000,
        method: "CARD",
        gateway: "STRIPE",
        gatewayChargeId: "ch_dash_1",
        status: "PAID",
        paidAt: new Date(),
      },
    });
    await prisma.enrollment.create({
      data: { userId: student.id, courseId: course.id, status: "ACTIVE" },
    });

    mockGetCurrentUser.mockResolvedValue(instructor as never);
    const stats = await getDashboardStats();

    expect(stats.monthlyRevenueCents).toBe(5000);
    expect(stats.publishedCourses).toBe(1);
    expect(stats.newStudents).toBe(1);
    expect(stats.revenueByDay).toHaveLength(30);
    expect(stats.topCourses[0].id).toBe(course.id);
    expect(stats.topCourses[0].revenueCents).toBe(5000);
  });

  it("pagamento PENDING não entra na receita", async () => {
    const instructor = await makeInstructor("qe@test.com");
    const course = await makeCourse(instructor.id, "qe-curso");
    const student = await prisma.user.create({
      data: { name: "S", email: "qe-aluno@test.com", role: "STUDENT" },
    });
    await prisma.payment.create({
      data: {
        userId: student.id,
        courseId: course.id,
        amountCents: 9999,
        method: "PIX",
        gateway: "MERCADO_PAGO",
        gatewayChargeId: "ch_dash_pending",
        status: "PENDING",
      },
    });

    mockGetCurrentUser.mockResolvedValue(instructor as never);
    const stats = await getDashboardStats();
    expect(stats.monthlyRevenueCents).toBe(0);
  });
});

describe("getEnrollmentsForAdmin", () => {
  it("calcula o progresso percentual do aluno", async () => {
    const instructor = await makeInstructor("qf@test.com");
    const course = await makeCourse(instructor.id, "qf-curso");
    const mod = await prisma.module.create({
      data: { courseId: course.id, title: "M1", order: 0 },
    });
    const l1 = await prisma.lesson.create({
      data: { moduleId: mod.id, title: "A1", type: "VIDEO", order: 0 },
    });
    await prisma.lesson.create({ data: { moduleId: mod.id, title: "A2", type: "VIDEO", order: 1 } });
    const student = await prisma.user.create({
      data: { name: "S", email: "qf-aluno@test.com", role: "STUDENT" },
    });
    await prisma.enrollment.create({
      data: { userId: student.id, courseId: course.id, status: "ACTIVE" },
    });
    await prisma.lessonProgress.create({
      data: { userId: student.id, lessonId: l1.id, watchedSeconds: 100, completed: true },
    });

    mockGetCurrentUser.mockResolvedValue(instructor as never);
    const rows = await getEnrollmentsForAdmin();

    expect(rows).toHaveLength(1);
    expect(rows[0].progressPct).toBe(50);
    expect(rows[0].user.email).toBe("qf-aluno@test.com");
  });
});
