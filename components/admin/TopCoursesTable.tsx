import Link from "next/link";
import { formatCurrency } from "@/lib/admin/format";

export function TopCoursesTable({
  courses,
}: {
  courses: { id: string; title: string; revenueCents: number; enrollments: number }[];
}) {
  return (
    <div className="bg-surface border border-adminBorder rounded-lg p-4">
      <div className="text-sm font-semibold text-textPrimary mb-2">Cursos com melhor desempenho</div>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-left text-textSecondary">
            <th className="py-2 font-medium">Curso</th>
            <th className="font-medium">Alunos</th>
            <th className="font-medium">Receita</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((c) => (
            <tr key={c.id} className="border-t border-adminBorder">
              <td className="py-2">
                <Link href={`/admin/cursos/${c.id}`} className="font-medium text-accent hover:underline">
                  {c.title}
                </Link>
              </td>
              <td className="text-textPrimary">{c.enrollments}</td>
              <td className="text-textPrimary">{formatCurrency(c.revenueCents)}</td>
            </tr>
          ))}
          {courses.length === 0 && (
            <tr>
              <td colSpan={3} className="py-4 text-textSecondary">
                Sem vendas ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
