export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function MyCoursesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/meus-cursos");
  const userId = (user as { id: string }).id;

  const enrollments = await prisma.enrollment.findMany({
    where: { userId, status: "ACTIVE" },
    include: { course: true },
  });
  const subscriptions = await prisma.subscription.findMany({
    where: { userId, status: "ACTIVE" },
    include: { plan: true },
  });

  return (
    <main className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold">Meus cursos</h1>
      {subscriptions.length > 0 && (
        <p className="text-sm text-gray-600 mt-2">
          Assinatura ativa: {subscriptions[0].plan.name}
        </p>
      )}
      <div className="grid md:grid-cols-2 gap-4 mt-6">
        {enrollments.map((e) => (
          <Link key={e.id} href={`/curso/${e.course.slug}`} className="border rounded p-4 bg-white">
            <h2 className="font-semibold">{e.course.title}</h2>
          </Link>
        ))}
      </div>
      {enrollments.length === 0 && <p className="text-gray-500 mt-6">Você ainda não está matriculado em nenhum curso.</p>}
    </main>
  );
}
