"use server";

import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  setGatewayEnabledRaw,
  testStripeConnection,
  testMercadoPagoConnection,
  type GatewayName,
} from "@/lib/admin/gateways";

export async function setGatewayEnabled(gateway: GatewayName, enabled: boolean) {
  await requireRole(["ADMIN"]);
  await setGatewayEnabledRaw(gateway, enabled);
  revalidatePath("/admin/config");
  return { success: true };
}

export async function testStripe() {
  await requireRole(["ADMIN"]);
  return testStripeConnection();
}

export async function testMercadoPago() {
  await requireRole(["ADMIN"]);
  return testMercadoPagoConnection();
}
