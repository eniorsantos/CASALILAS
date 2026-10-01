"use client";
import { useState } from "react";

export function CheckoutButton({ courseId }: { courseId: string }) {
  const [loading, setLoading] = useState(false);

  async function checkout(gateway: "stripe" | "mercadopago") {
    setLoading(true);
    const res = await fetch(`/api/checkout/${gateway}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.url) window.location.href = data.url;
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        disabled={loading}
        onClick={() => checkout("stripe")}
        className="rounded bg-st-accent px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        Pagar com cartão (Stripe)
      </button>
      <button
        disabled={loading}
        onClick={() => checkout("mercadopago")}
        className="rounded border border-st-border bg-st-surface-2 px-4 py-3 text-sm font-bold text-st-text disabled:opacity-50"
      >
        Pagar com Pix (MP)
      </button>
    </div>
  );
}
