"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { courseSchema, type CourseFormData } from "@/lib/validation/course";
import { updateCourse } from "@/app/(admin)/admin/cursos/actions";
import { handleAction } from "@/lib/admin/action-feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

/**
 * Mesmo schema Zod da Server Action, reaproveitado no client (seção 6.1).
 * O preço é editado na aba Preço, mas viaja junto (hidden) porque
 * updateCourse valida o objeto completo.
 */
export function CourseInfoForm({
  course,
}: {
  course: { id: string; title: string; description: string; priceCents: number };
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: course.title,
      description: course.description,
      priceCents: course.priceCents,
    },
  });
  const description = watch("description");

  async function onSubmit(data: CourseFormData) {
    const formData = new FormData();
    formData.set("title", data.title);
    formData.set("description", data.description);
    formData.set("priceCents", String(data.priceCents));
    await handleAction(() => updateCourse(course.id, formData), "Curso atualizado");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
      <div>
        <Label>Título</Label>
        <Input {...register("title")} />
        {errors.title && <p className="text-xs text-danger mt-1">{errors.title.message}</p>}
      </div>
      <div>
        <Label>Descrição</Label>
        <RichTextEditor
          content={description}
          onChange={(html) => setValue("description", html, { shouldValidate: true })}
        />
        {errors.description && (
          <p className="text-xs text-danger mt-1">{errors.description.message}</p>
        )}
      </div>
      <Button type="submit" variant="accent" disabled={isSubmitting}>
        {isSubmitting ? "Salvando..." : "Salvar alterações"}
      </Button>
    </form>
  );
}
