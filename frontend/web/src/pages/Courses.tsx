import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { Course } from "@plataforma/shared";
import { useApi } from "../api/client";

export function CoursesPage() {
  const api = useApi();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: () => api.get<Course[]>("/api/admin/courses"),
  });

  return (
    <div>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Cursos</h1>
        <Link to="/cursos/novo" className="bg-black text-white px-4 py-2 rounded">
          Novo curso
        </Link>
      </div>
      {isLoading && <p className="mt-4">Carregando…</p>}
      <ul className="mt-6 space-y-2">
        {data?.map((c) => (
          <li key={c.id} className="border rounded p-3 bg-white flex justify-between">
            <span>
              {c.title} — {c.status}
            </span>
            <Link to={`/cursos/${c.id}`} className="underline">
              Editar
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
