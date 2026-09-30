import { useQuery } from "@tanstack/react-query";
import type { Course, Enrollment } from "@plataforma/shared";
import { useApi } from "../api/client";

export function DashboardPage() {
  const api = useApi();
  const courses = useQuery({
    queryKey: ["admin-courses"],
    queryFn: () => api.get<Course[]>("/api/admin/courses"),
  });
  const enrollments = useQuery({
    queryKey: ["admin-enrollments"],
    queryFn: () => api.get<Enrollment[]>("/api/admin/enrollments?take=5"),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <div className="border rounded p-4 bg-white">
          <h2 className="font-semibold">Cursos</h2>
          <p className="text-3xl font-bold mt-2">{courses.data?.length ?? "—"}</p>
        </div>
        <div className="border rounded p-4 bg-white">
          <h2 className="font-semibold">Últimas matrículas</h2>
          <ul className="mt-2 text-sm space-y-1">
            {enrollments.data?.map((e) => (
              <li key={e.id}>
                {e.course?.title} — {e.status}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
