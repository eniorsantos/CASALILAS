import { createApiClient } from "../shared";
import { getToken } from "../auth/session";

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

/** Client autenticado (JWT via SecureStore). */
export const api = createApiClient({ baseURL: API_URL, getToken });

/** Mesma base para abrir telas web (checkout, verificação) no navegador. */
export function webUrl(path: string): string {
  return `${API_URL}${path}`;
}
