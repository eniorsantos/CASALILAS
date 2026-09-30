export const dynamic = "force-dynamic";

import { getCoursesForAdmin } from "@/lib/admin/queries";
import { CoursesTable, NewCourseButton } from "@/components/admin/CoursesTable";
import { DataStateWrapper, EmptyActionLink } from "@/components/admin/DataStateWrapper";

export default async function CoursesPage() {
  const courses = await getCoursesForAdmin();

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-[22px] font-bold text-textPrimary">Cursos</h1>
        <NewCourseButton />
      </div>
      <DataStateWrapper
        loading={false}
        empty={courses.length === 0}
        emptyState={{
          title: "Nenhum curso criado ainda",
          description: "Comece criando seu primeiro curso para a plataforma.",
          action: <EmptyActionLink href="/admin/cursos/novo" label="Criar primeiro curso" />,
        }}
      >
        <CoursesTable courses={courses} />
      </DataStateWrapper>
    </div>
  );
}
