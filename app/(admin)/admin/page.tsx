export const dynamic = "force-dynamic";

import { getDashboardStats } from "@/lib/admin/queries";
import { formatCurrency } from "@/lib/admin/format";
import { StatCard } from "@/components/admin/StatCard";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { TopCoursesTable } from "@/components/admin/TopCoursesTable";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <h1 className="text-[22px] font-bold text-textPrimary">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Receita no mês"
          value={formatCurrency(stats.monthlyRevenueCents)}
          trend={stats.revenueTrend}
        />
        <StatCard label="Novos alunos" value={String(stats.newStudents)} trend={stats.studentsTrend} />
        <StatCard label="Cursos publicados" value={String(stats.publishedCourses)} />
      </div>
      <RevenueChart data={stats.revenueByDay} />
      <TopCoursesTable courses={stats.topCourses} />
    </div>
  );
}
