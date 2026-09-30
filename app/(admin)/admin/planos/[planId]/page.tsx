export const dynamic = "force-dynamic";

import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PlanForm } from "@/components/admin/PlanForm";

export default async function EditPlanPage({ params }: { params: { planId: string } }) {
  const user = await getCurrentUser();
  if ((user as { role?: string } | null)?.role !== "ADMIN") redirect("/admin");

  const plan = await prisma.plan.findUnique({
    where: { id: params.planId },
    include: { courses: { select: { courseId: true } } },
  });
  if (!plan) notFound();

  const courses = await prisma.course.findMany({
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });

  return (
    <PlanForm
      plan={{
        id: plan.id,
        name: plan.name,
        priceCents: plan.priceCents,
        interval: plan.interval,
        stripePriceId: plan.stripePriceId,
        mpPreapprovalPlanId: plan.mpPreapprovalPlanId,
        isAllCourses: plan.isAllCourses,
      }}
      courses={courses}
      selectedCourseIds={plan.courses.map((c) => c.courseId)}
    />
  );
}
