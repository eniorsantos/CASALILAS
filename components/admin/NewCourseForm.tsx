"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { courseSchema, type CourseFormData } from "@/lib/validation/course";
import { createCourse } from "@/app/(admin)/admin/cursos/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewCourseForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: { title: "", description: "", priceCents: 0 },
  });

  async function onSubmit(data: CourseFormData) {
    const formData = new FormData();
    formData.set("title", data.title);
    formData.set("description", data.description);
    formData.set("priceCents", String(data.priceCents));
    const result = await createCourse(formData);
    if ("error" in result && result.error) {
      toast.error("Verifique os campos destacados");
      return;
    }
    if (result.success && result.courseId) {
      toast.success("Curso criado!");
      router.push(`/admin/cursos/${result.courseId}`);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
      <h1 className="text-[22px] font-bold text-textPrimary">Novo curso</h1>
      <div>
        <Label>Título</Label>
        <Input {...register("title")} placeholder="Ex.: TypeScript do zero" />
        {errors.title && <p className="text-xs text-danger mt-1">{errors.title.message}</p>}
      </div>
      <div>
        <Label>Descrição</Label>
        <Input {...register("description")} placeholder="Descreva o curso (mín. 10 caracteres)" />
        {errors.description && (
          <p className="text-xs text-danger mt-1">{errors.description.message}</p>
        )}
      </div>
      <div>
        <Label>Preço em centavos</Label>
        <Input type="number" min={0} {...register("priceCents", { valueAsNumber: true })} />
        {errors.priceCents && (
          <p className="text-xs text-danger mt-1">{errors.priceCents.message}</p>
        )}
      </div>
      <Button type="submit" variant="accent" disabled={isSubmitting}>
        {isSubmitting ? "Criando..." : "Criar curso"}
      </Button>
    </form>
  );
}
