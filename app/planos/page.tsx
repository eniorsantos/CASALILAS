export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";

export default async function PlansPage() {
  const plans = await prisma.plan.findMany();
  return (
    <main className="max-w-3xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold">Planos de assinatura</h1>
      <div className="grid md:grid-cols-2 gap-4 mt-8">
        {plans.map((p) => (
          <div key={p.id} className="border rounded p-4 bg-white">
            <h2 className="font-bold">{p.name}</h2>
            <p>R$ {(p.priceCents / 100).toFixed(2)} / {p.interval === "MONTHLY" ? "mês" : "ano"}</p>
          </div>
        ))}
      </div>
      {plans.length === 0 && <p className="text-gray-500 mt-6">Nenhum plano disponível.</p>}
    </main>
  );
}
