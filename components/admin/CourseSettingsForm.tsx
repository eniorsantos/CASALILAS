"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { publishCourse, deleteCourse } from "@/app/(admin)/admin/cursos/actions";
import { handleAction } from "@/lib/admin/action-feedback";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";

export function CourseSettingsForm({
  course,
}: {
  course: { id: string; title: string; status: string };
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <Label>Status atual</Label>
        <div className="mt-1">
          <StatusBadge status={course.status} />
        </div>
        {course.status === "DRAFT" && (
          <Button
            className="mt-3"
            variant="accent"
            onClick={() =>
              handleAction(() => publishCourse(course.id), "Curso publicado!").then(
                (ok) => ok && router.refresh()
              )
            }
          >
            Publicar curso
          </Button>
        )}
      </div>
      <div className="border-t border-adminBorder pt-6">
        <Label>Zona de risco</Label>
        <p className="text-sm text-textSecondary mt-1">
          Excluir remove módulos, aulas e o acesso de alunos matriculados. Ação irreversível.
        </p>
        <Button className="mt-3" variant="destructive" onClick={() => setConfirmOpen(true)}>
          Excluir curso
        </Button>
        <ConfirmDeleteDialog
          itemName={course.title}
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          onConfirm={async () => {
            const ok = await handleAction(() => deleteCourse(course.id), "Curso excluído");
            if (ok) router.push("/admin/cursos");
          }}
        />
      </div>
    </div>
  );
}
