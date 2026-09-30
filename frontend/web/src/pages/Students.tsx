import { useQuery } from "@tanstack/react-query";
import type { Enrollment } from "@plataforma/shared";
import { useApi } from "../api/client";

export function StudentsPage() {
  const api = useApi();
  const { data } = useQuery({
    queryKey: ["admin-enrollments"],
    queryFn: () => api.get<Enrollment[]>("/api/admin/enrollments?take=50"),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Alunos</h1>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">Curso</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((e) => (
            <tr key={e.id} className="border-b">
              <td className="py-2">{e.course?.title}</td>
              <td>{e.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
