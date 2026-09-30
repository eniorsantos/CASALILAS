import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

// Fallback dummy permite `next build` sem token real (só usado em chamadas de API).
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN ?? "TEST_DUMMY",
});

export const preferenceClient = new Preference(client);
export const mpPaymentClient = new Payment(client);
export { client as mpClient };
