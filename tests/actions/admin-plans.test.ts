import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { createPlan, updatePlan, deletePlan } from "@/app/(admin)/admin/planos/actions";
import { isGatewayEnabled, setGatewayEnabledRaw } from "@/lib/admin/gateways";

vi.mock("@/lib/auth", () => ({
  requireRole: vi.fn(),
  getCurrentUser: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

const mockRequireRole = vi.mocked(requireRole);

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireRole.mockResolvedValue({ id: "admin_1", role: "ADMIN" } as never);
});

async function makeCourses() {
  const instructor = await prisma.user.create({
    data: { name: "I", email: `inst-${Date.now()}@test.com`, role: "INSTRUCTOR" },
  });
  const suffix = Date.now().toString(36);
  const c1 = await prisma.course.create({
    data: { title: "C1", slug: `c1-${suffix}`, description: "Descricao valida longa", priceCents: 1000, instructorId: instructor.id },
  });
  const c2 = await prisma.course.create({
    data: { title: "C2", slug: `c2-${suffix}`, description: "Descricao valida longa", priceCents: 2000, instructorId: instructor.id },
  });
  return [c1, c2];
}

function planForm(overrides: Record<string, string | string[]> = {}) {
  const fd = new FormData();
  fd.set("name", "Plano Teste");
  fd.set("priceCents", "9900");
  fd.set("interval", "MONTHLY");
  for (const [k, v] of Object.entries(overrides)) {
    if (Array.isArray(v)) v.forEach((item) => fd.append(k, item));
    else fd.set(k, v);
  }
  return fd;
}

describe("CRUD de planos", () => {
  it("createPlan com subconjunto de cursos cria os vínculos", async () => {
    const [c1, c2] = await makeCourses();
    const result = (await createPlan(planForm({ courseIds: [c1.id, c2.id] }))) as {
      success?: boolean;
      planId?: string;
    };

    expect(result.success).toBe(true);
    const links = await prisma.planCourse.findMany({ where: { planId: result.planId! } });
    expect(links).toHaveLength(2);
  });

  it("createPlan com todos os cursos não cria vínculos", async () => {
    await makeCourses();
    const result = (await createPlan(planForm({ isAllCourses: "on" }))) as {
      success?: boolean;
      planId?: string;
    };

    expect(result.success).toBe(true);
    const plan = await prisma.plan.findUniqueOrThrow({ where: { id: result.planId! } });
    expect(plan.isAllCourses).toBe(true);
    const links = await prisma.planCourse.findMany({ where: { planId: plan.id } });
    expect(links).toHaveLength(0);
  });

  it("createPlan exige curso quando não é todos", async () => {
    const result = (await createPlan(planForm())) as { error?: unknown };
    expect(result.error).toBeDefined();
  });

  it("instrutor não cria plano (só ADMIN)", async () => {
    mockRequireRole.mockRejectedValue(new Error("Não autorizado"));
    await expect(createPlan(planForm({ isAllCourses: "on" }))).rejects.toThrow("Não autorizado");
  });

  it("updatePlan troca nome, preço e cobertura", async () => {
    const [c1, c2] = await makeCourses();
    const created = (await createPlan(planForm({ name: "Antigo", courseIds: [c1.id] }))) as {
      planId: string;
    };
    const planId = created.planId;

    const updated = await updatePlan(planId, planForm({ name: "Novo", priceCents: "19900", courseIds: [c2.id] }));
    expect(updated).toEqual({ success: true });

    const plan = await prisma.plan.findUniqueOrThrow({ where: { id: planId } });
    expect(plan.name).toBe("Novo");
    expect(plan.priceCents).toBe(19900);
    const links = await prisma.planCourse.findMany({ where: { planId } });
    expect(links.map((l) => l.courseId)).toEqual([c2.id]);
  });

  it("deletePlan bloqueia plano com assinaturas e libera sem", async () => {
    await makeCourses();
    const created = (await createPlan(planForm({ name: "Com assinantes", isAllCourses: "on" }))) as {
      planId: string;
    };
    const planId = created.planId;

    const student = await prisma.user.create({
      data: { name: "S", email: `sub-${Date.now()}@test.com`, role: "STUDENT" },
    });
    await prisma.subscription.create({
      data: {
        userId: student.id,
        planId,
        gateway: "STRIPE",
        gatewaySubscriptionId: `sub_${Date.now()}`,
        status: "ACTIVE",
        currentPeriodEnd: new Date(Date.now() + 86400000),
      },
    });

    const blocked = (await deletePlan(planId)) as { error?: string };
    expect(blocked.error).toContain("assinatura");

    await prisma.subscription.deleteMany({ where: { planId } });
    const ok = await deletePlan(planId);
    expect(ok).toEqual({ success: true });
    expect(await prisma.plan.findUnique({ where: { id: planId } })).toBeNull();
  });
});

describe("liga/desliga de gateway", () => {
  it("default é ligado; persiste o desligamento", async () => {
    expect(await isGatewayEnabled("STRIPE")).toBe(true);
    await setGatewayEnabledRaw("STRIPE", false);
    expect(await isGatewayEnabled("STRIPE")).toBe(false);
    await setGatewayEnabledRaw("STRIPE", true);
    expect(await isGatewayEnabled("MERCADO_PAGO")).toBe(true);
  });
});
