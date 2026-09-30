export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function HomePage() {
  const courses = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    take: 12,
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="max-w-5xl mx-auto py-16 px-4">
      <h1 className="text-4xl font-bold">Plataforma de Cursos</h1>
      <p className="mt-2 text-gray-600">Aprenda no seu ritmo, com certificado.</p>
      <div className="mt-4 flex gap-3">
        <Link href="/planos" className="underline">Ver planos</Link>
        <Link href="/meus-cursos" className="underline">Meus cursos</Link>
      </div>
      <div className="grid md:grid-cols-3 gap-4 mt-10">
        {courses.map((c) => (
          <Link key={c.id} href={`/curso/${c.slug}`} className="border rounded-lg p-4 bg-white">
            <h2 className="font-semibold">{c.title}</h2>
            <p className="text-sm text-gray-600 line-clamp-2">{c.description}</p>
            <p className="mt-2 font-bold">R$ {(c.priceCents / 100).toFixed(2)}</p>
          </Link>
        ))}
      </div>
      {courses.length === 0 && <p className="mt-8 text-gray-500">Nenhum curso publicado ainda.</p>}
    </main>
  );
}
