"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const planSchema = z.object({
  name: z.string().min(3, "Nome muito curto"),
  priceCents: z.coerce.number().int().min(0),
  interval: z.enum(["MONTHLY", "YEARLY"]),
  stripePriceId: z.string().optional(),
  mpPreapprovalPlanId: z.string().optional(),
});

function parsePlanForm(formData: FormData) {
  const parsed = planSchema.safeParse({
    name: formData.get("name"),
    priceCents: formData.get("priceCents"),
    interval: formData.get("interval"),
    stripePriceId: (formData.get("stripePriceId") as string) || undefined,
    mpPreapprovalPlanId: (formData.get("mpPreapprovalPlanId") as string) || undefined,
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  const isAllCourses = formData.get("isAllCourses") === "on";
  const courseIds = formData.getAll("courseIds").map(String).filter(Boolean);
  if (!isAllCourses && courseIds.length === 0) {
    return { error: "Selecione ao menos um curso ou marque 'todos os cursos'" };
  }
  return { data: { ...parsed.data, isAllCourses, courseIds } };
}

export async function createPlan(formData: FormData) {
  await requireRole(["ADMIN"]);
  const parsed = parsePlanForm(formData);
  if ("error" in parsed) return parsed;

  const plan = await prisma.$transaction(async (tx) => {
    const created = await tx.plan.create({
      data: {
        name: parsed.data.name,
        priceCents: parsed.data.priceCents,
        interval: parsed.data.interval,
        stripePriceId: parsed.data.stripePriceId,
        mpPreapprovalPlanId: parsed.data.mpPreapprovalPlanId,
        isAllCourses: parsed.data.isAllCourses,
      },
    });
    if (!parsed.data.isAllCourses) {
      await tx.planCourse.createMany({
        data: parsed.data.courseIds.map((courseId) => ({ planId: created.id, courseId })),
      });
    }
    return created;
  });

  revalidatePath("/admin/planos");
  return { success: true, planId: plan.id };
}

export async function updatePlan(planId: string, formData: FormData) {
  await requireRole(["ADMIN"]);
  const parsed = parsePlanForm(formData);
  if ("error" in parsed) return parsed;

  await prisma.$transaction(async (tx) => {
    await tx.plan.update({
      where: { id: planId },
      data: {
        name: parsed.data.name,
        priceCents: parsed.data.priceCents,
        interval: parsed.data.interval,
        stripePriceId: parsed.data.stripePriceId,
        mpPreapprovalPlanId: parsed.data.mpPreapprovalPlanId,
        isAllCourses: parsed.data.isAllCourses,
      },
    });
    await tx.planCourse.deleteMany({ where: { planId } });
    if (!parsed.data.isAllCourses) {
      await tx.planCourse.createMany({
        data: parsed.data.courseIds.map((courseId) => ({ planId, courseId })),
      });
    }
  });

  revalidatePath("/admin/planos");
  return { success: true };
}

export async function deletePlan(planId: string) {
  await requireRole(["ADMIN"]);
  const linked = await prisma.subscription.count({ where: { planId } });
  if (linked > 0) {
    return { error: `Plano com ${linked} assinatura(s) vinculada(s) não pode ser excluído` };
  }
  await prisma.plan.delete({ where: { id: planId } });
  revalidatePath("/admin/planos");
  return { success: true };
}
