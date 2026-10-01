export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { StudentNav } from "@/components/streaming";

export default async function PlansPage() {
  const plans = await prisma.plan.findMany();
  return (
    <div className="theme-streaming min-h-screen bg-st-bg text-st-text">
      <StudentNav />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8">
        <h1 className="font-display text-4xl tracking-wide">PLANOS DE ASSINATURA</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {plans.map((p) => (
            <div key={p.id} className="rounded-lg border border-st-border bg-st-surface p-5">
              <h2 className="font-bold text-st-text">{p.name}</h2>
              <p className="mt-2 font-display text-3xl text-st-accent-warm">
                R$ {(p.priceCents / 100).toFixed(2)}
                <span className="font-sans text-xs font-normal text-st-dim">
                  {" "}
                  / {p.interval === "MONTHLY" ? "mês" : "ano"}
                </span>
              </p>
              <p className="mt-1 text-xs text-st-dim">
                {p.isAllCourses ? "Acesso a todos os cursos" : "Subconjunto de cursos"}
              </p>
            </div>
          ))}
        </div>
        {plans.length === 0 && (
          <p className="mt-6 text-sm text-st-dim">Nenhum plano disponível.</p>
        )}
      </main>
    </div>
  );
}
