import { createApiClient } from "@plataforma/shared";
import { useAuth } from "../contexts/AuthContext";

/** Client apontando para o backend Next.js (VITE_API_URL). */
export const api = createApiClient({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
  getToken: () => localStorage.getItem("plataforma.token"),
});

/** Hook que expõe o client dentro de componentes. */
export function useApi() {
  const { token } = useAuth();
  void token; // re-cria o client quando o token muda
  return createApiClient({
    baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
    getToken: () => localStorage.getItem("plataforma.token"),
  });
}
