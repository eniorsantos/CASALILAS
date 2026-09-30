"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { assertOwnsCourse } from "@/app/(admin)/admin/cursos/actions";

export async function createModule(courseId: string, title: string) {
  const user = await requireRole(["ADMIN", "INSTRUCTOR"]);
  await assertOwnsCourse(user, courseId);
  const lastModule = await prisma.module.findFirst({
    where: { courseId },
    orderBy: { order: "desc" },
  });
  await prisma.module.create({
    data: { courseId, title, order: (lastModule?.order ?? 0) + 1 },
  });
  revalidatePath(`/admin/cursos/${courseId}`);
  return { success: true };
}

export async function reorderModules(courseId: string, orderedIds: string[]) {
  const user = await requireRole(["ADMIN", "INSTRUCTOR"]);
  await assertOwnsCourse(user, courseId);
  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.module.update({ where: { id }, data: { order: index } }))
  );
  revalidatePath(`/admin/cursos/${courseId}`);
  return { success: true };
}

export async function createLesson(moduleId: string, title: string, type: "VIDEO" | "TEXT" | "QUIZ") {
  await requireRole(["ADMIN", "INSTRUCTOR"]);
  const lastLesson = await prisma.lesson.findFirst({
    where: { moduleId },
    orderBy: { order: "desc" },
  });
  const lesson = await prisma.lesson.create({
    data: { moduleId, title, type, order: (lastLesson?.order ?? 0) + 1 },
  });
  return { success: true, lessonId: lesson.id };
}

async function courseIdOfModule(moduleId: string): Promise<string> {
  const mod = await prisma.module.findUniqueOrThrow({ where: { id: moduleId } });
  return mod.courseId;
}

export async function updateModuleTitle(moduleId: string, title: string) {
  const user = await requireRole(["ADMIN", "INSTRUCTOR"]);
  await assertOwnsCourse(user, await courseIdOfModule(moduleId));
  if (!title || title.trim().length < 2) return { error: "Título muito curto" };
  await prisma.module.update({ where: { id: moduleId }, data: { title: title.trim() } });
  return { success: true };
}

export async function updateLessonTitle(lessonId: string, title: string) {
  const user = await requireRole(["ADMIN", "INSTRUCTOR"]);
  const lesson = await prisma.lesson.findUniqueOrThrow({
    where: { id: lessonId },
    include: { module: true },
  });
  await assertOwnsCourse(user, lesson.module.courseId);
  if (!title || title.trim().length < 2) return { error: "Título muito curto" };
  await prisma.lesson.update({ where: { id: lessonId }, data: { title: title.trim() } });
  revalidatePath(`/admin/cursos/${lesson.module.courseId}`);
  return { success: true };
}

export async function toggleFreePreview(lessonId: string, value: boolean) {
  const user = await requireRole(["ADMIN", "INSTRUCTOR"]);
  const lesson = await prisma.lesson.findUniqueOrThrow({
    where: { id: lessonId },
    include: { module: true },
  });
  await assertOwnsCourse(user, lesson.module.courseId);
  await prisma.lesson.update({ where: { id: lessonId }, data: { isFreePreview: value } });
  revalidatePath(`/admin/cursos/${lesson.module.courseId}`);
  return { success: true };
}

/** Revoga acesso manualmente (edge case: reembolso). Só ADMIN. */
export async function revokeEnrollment(enrollmentId: string) {
  await requireRole(["ADMIN"]);
  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { status: "CANCELED" },
  });
  revalidatePath("/admin/alunos");
  return { success: true };
}
