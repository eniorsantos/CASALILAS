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
    <div className="flex gap-2">
      <button disabled={loading} onClick={() => checkout("stripe")} className="bg-black text-white px-4 py-2 rounded">
        Pagar com cartão (Stripe)
      </button>
      <button disabled={loading} onClick={() => checkout("mercadopago")} className="border px-4 py-2 rounded">
        Pagar com Pix (MP)
      </button>
    </div>
  );
}
