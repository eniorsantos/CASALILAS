export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PlanForm } from "@/components/admin/PlanForm";

export default async function NewPlanPage() {
  const user = await getCurrentUser();
  if ((user as { role?: string } | null)?.role !== "ADMIN") redirect("/admin");

  const courses = await prisma.course.findMany({
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });

  return <PlanForm courses={courses} />;
}
