import { useQuery } from "@tanstack/react-query";
import type { Plan } from "@plataforma/shared";
import { useApi } from "../api/client";

export function PlansPage() {
  const api = useApi();
  const { data } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => api.get<Plan[]>("/api/admin/plans"),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Planos de assinatura</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {data?.map((p) => (
          <div key={p.id} className="border rounded p-4 bg-white">
            <h2 className="font-bold">{p.name}</h2>
            <p>
              R$ {(p.priceCents / 100).toFixed(2)} / {p.interval === "MONTHLY" ? "mês" : "ano"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
