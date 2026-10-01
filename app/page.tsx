export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CourseTile, SectionTitle, StudentNav, TileRow } from "@/components/streaming";

export default async function HomePage() {
  const courses = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
    take: 12,
    orderBy: { createdAt: "desc" },
  });
  const hero = courses[0];

  return (
    <div className="theme-streaming min-h-screen bg-st-bg text-st-text">
      <StudentNav />
      <main className="mx-auto max-w-5xl px-4 pb-16">
        {hero ? (
          <section className="relative -mx-4 flex h-[300px] items-end overflow-hidden bg-gradient-to-br from-[#4A2E7A] to-[#1F1929] px-4 pb-5 md:mx-0 md:mt-4 md:rounded-lg">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-st-bg" />
            <div className="relative z-10">
              <span className="mb-2 inline-block rounded-sm bg-st-accent-warm px-2 py-0.5 text-[9px] font-extrabold tracking-wide text-[#2A2033]">
                EM ALTA
              </span>
              <h1 className="font-display text-4xl leading-none md:text-5xl">{hero.title}</h1>
              <p className="mb-3 mt-1 text-[11px] text-st-dim">
                Curso · Certificado incluso
              </p>
              <div className="flex gap-2">
                <Link
                  href={`/curso/${hero.slug}`}
                  className="rounded bg-st-text px-4 py-2 text-xs font-bold text-[#111]"
                >
                  ▶ Assistir
                </Link>
                <Link
                  href={`/curso/${hero.slug}`}
                  className="rounded bg-white/20 px-4 py-2 text-xs font-bold text-st-text"
                >
                  ⓘ Detalhes
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <section className="py-16 text-center">
            <h1 className="font-display text-5xl">CURSOSFLIX</h1>
            <p className="mt-2 text-sm text-st-dim">Aprenda no seu ritmo, com certificado.</p>
          </section>
        )}

        <section className="mt-4">
          <SectionTitle>Catálogo</SectionTitle>
          <TileRow>
            {courses.map((c, i) => (
              <CourseTile
                key={c.id}
                href={`/curso/${c.slug}`}
                title={c.title}
                thumbnailUrl={c.thumbnailUrl}
                price={`R$ ${(c.priceCents / 100).toFixed(2)}`}
                gradientIndex={i}
              />
            ))}
          </TileRow>
          {courses.length === 0 && (
            <p className="mt-4 text-sm text-st-dim">Nenhum curso publicado ainda.</p>
          )}
        </section>

        <div className="mt-6 flex gap-4 text-sm">
          <Link href="/planos" className="text-st-accent-warm underline">
            Ver planos
          </Link>
          <Link href="/meus-cursos" className="text-st-accent-warm underline">
            Meus cursos
          </Link>
        </div>
      </main>
    </div>
  );
}
