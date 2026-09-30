export const dynamic = "force-dynamic";

import { getCoursesForAdmin, getEnrollmentsForAdmin } from "@/lib/admin/queries";
import { StudentsTable } from "@/components/admin/StudentsTable";
import { DataStateWrapper } from "@/components/admin/DataStateWrapper";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: { q?: string; courseId?: string };
}) {
  const [enrollments, courses] = await Promise.all([
    getEnrollmentsForAdmin(),
    getCoursesForAdmin(),
  ]);

  const q = (searchParams.q ?? "").toLowerCase();
  const filtered = enrollments.filter((e) => {
    const matchesQ =
      !q || e.user.name.toLowerCase().includes(q) || e.user.email.toLowerCase().includes(q);
    const matchesCourse = !searchParams.courseId || e.course.id === searchParams.courseId;
    return matchesQ && matchesCourse;
  });

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h1 className="text-[22px] font-bold text-textPrimary">Alunos</h1>
        <form method="GET" className="flex gap-2">
          <Input
            name="q"
            defaultValue={searchParams.q ?? ""}
            placeholder="Buscar por nome ou email..."
            className="w-64"
          />
          <select
            name="courseId"
            defaultValue={searchParams.courseId ?? ""}
            className="h-9 rounded-md border border-adminBorder bg-surface px-2 text-sm text-textPrimary"
          >
            <option value="">Todos os cursos</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <Button type="submit" variant="outline" size="sm">
            Filtrar
          </Button>
        </form>
      </div>
      <DataStateWrapper
        loading={false}
        empty={filtered.length === 0}
        emptyState={{
          title: "Nenhum aluno encontrado",
          description: "Ajuste os filtros ou aguarde as primeiras vendas.",
        }}
      >
        <StudentsTable enrollments={filtered} />
      </DataStateWrapper>
    </div>
  );
}
