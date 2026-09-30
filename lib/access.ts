import { prisma } from "./prisma";

/**
 * Checagem centralizada de acesso a um curso.
 * Vale para compra única (Enrollment) e assinatura (Subscription + Plan).
 */
export async function hasAccessToCourse(userId: string, courseId: string): Promise<boolean> {
  const directEnrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (directEnrollment?.status === "ACTIVE") return true;

  const activeSubscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      currentPeriodEnd: { gt: new Date() },
      plan: {
        OR: [{ isAllCourses: true }, { courses: { some: { courseId } } }],
      },
    },
  });
  return !!activeSubscription;
}
