"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import slugify from "slugify";
import { courseSchema } from "@/lib/validation/course";

export async function createCourse(formData: FormData) {
  const user = await requireRole(["ADMIN", "INSTRUCTOR"]);
  const parsed = courseSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    priceCents: formData.get("priceCents"),
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  const course = await prisma.course.create({
    data: {
      ...parsed.data,
      slug: slugify(parsed.data.title, { lower: true, strict: true }),
      instructorId: user.id,
      status: "DRAFT",
    },
  });
  revalidatePath("/admin/cursos");
  return { success: true, courseId: course.id };
}

export async function updateCourse(courseId: string, formData: FormData) {
  const user = await requireRole(["ADMIN", "INSTRUCTOR"]);
  await assertOwnsCourse(user, courseId);
  const parsed = courseSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    priceCents: formData.get("priceCents"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };
  await prisma.course.update({ where: { id: courseId }, data: parsed.data });
  revalidatePath(`/admin/cursos/${courseId}`);
  return { success: true };
}

export async function publishCourse(courseId: string) {
  const user = await requireRole(["ADMIN", "INSTRUCTOR"]);
  await assertOwnsCourse(user, courseId);
  const moduleCount = await prisma.module.count({ where: { courseId } });
  if (moduleCount === 0) {
    return { error: "Adicione ao menos um módulo antes de publicar" };
  }
  await prisma.course.update({ where: { id: courseId }, data: { status: "PUBLISHED" } });
  revalidatePath(`/admin/cursos/${courseId}`);
  return { success: true };
}

export async function deleteCourse(courseId: string) {
  await requireRole(["ADMIN"]);
  await prisma.course.delete({ where: { id: courseId } });
  revalidatePath("/admin/cursos");
  return { success: true };
}

export async function assertOwnsCourse(user: { id: string; role: string }, courseId: string) {
  if (user.role === "ADMIN") return;
  const course = await prisma.course.findUniqueOrThrow({ where: { id: courseId } });
  if (course.instructorId !== user.id) {
    throw new Error("Você não tem permissão para editar este curso");
  }
}
