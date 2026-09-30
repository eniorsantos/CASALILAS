import Stripe from "stripe";

// Fallback dummy permite `next build` / `prisma generate` sem chaves reais.
// Em runtime, checkout/webhooks usam as chaves de TESTE (staging) ou reais (prod)
// via Vercel/Railway env vars.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_dummy", {
  apiVersion: "2024-06-20",
});
