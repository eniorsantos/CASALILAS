"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDate } from "@/lib/admin/format";
import { handleAction } from "@/lib/admin/action-feedback";
import { revokeEnrollment } from "@/app/(admin)/admin/cursos/[id]/actions";
import type { AdminEnrollmentRow } from "@/lib/admin/queries";

export function StudentsTable({ enrollments }: { enrollments: AdminEnrollmentRow[] }) {
  const [selected, setSelected] = useState<AdminEnrollmentRow | null>(null);

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-adminBorder">
        <table className="w-full text-[13px] bg-surface">
          <thead className="bg-surfaceMuted">
            <tr className="text-left text-textSecondary">
              <th className="px-4 py-3 font-medium">Aluno</th>
              <th className="px-4 py-3 font-medium">Curso</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Progresso</th>
              <th className="px-4 py-3 font-medium">Matrícula</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {enrollments.map((e) => (
              <tr key={e.id} className="border-t border-adminBorder hover:bg-surfaceMuted">
                <td className="px-4 py-3">
                  <div className="font-medium text-textPrimary">{e.user.name}</div>
                  <div className="text-textSecondary">{e.user.email}</div>
                </td>
                <td className="px-4 py-3 text-textPrimary">{e.course.title}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={e.status} />
                </td>
                <td className="px-4 py-3 text-textPrimary">{e.progressPct}%</td>
                <td className="px-4 py-3 text-textPrimary">{formatDate(e.enrolledAt)}</td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="outline" onClick={() => setSelected(e)}>
                    Ver detalhes
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <StudentDetailDialog enrollment={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function StudentDetailDialog({
  enrollment,
  onClose,
}: {
  enrollment: AdminEnrollmentRow | null;
  onClose: () => void;
}) {
  const router = useRouter();

  return (
    <Dialog open={!!enrollment} onOpenChange={(open) => !open && onClose()}>
      {enrollment && (
        <DialogContent>
          <DialogTitle>{enrollment.user.name}</DialogTitle>
          <div className="space-y-2 text-sm text-textPrimary">
            <p className="text-textSecondary">{enrollment.user.email}</p>
            <p>
              Curso: <strong>{enrollment.course.title}</strong>
            </p>
            <p>
              Status: <StatusBadge status={enrollment.status} />
            </p>
            <p>Progresso: {enrollment.progressPct}% das aulas concluídas</p>
            <p>Matrícula em {formatDate(enrollment.enrolledAt)}</p>
          </div>
          <DialogFooter>
            {enrollment.status === "ACTIVE" && (
              <Button
                variant="destructive"
                onClick={() =>
                  handleAction(() => revokeEnrollment(enrollment.id), "Acesso revogado").then(
                    (ok) => {
                      if (ok) {
                        onClose();
                        router.refresh();
                      }
                    }
                  )
                }
              >
                Revogar acesso
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
