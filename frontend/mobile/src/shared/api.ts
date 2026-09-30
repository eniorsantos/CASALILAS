import type { ApiError } from "./types";

export interface ApiClientOptions {
  baseURL: string;
  /** Retorna o token de sessão (web: localStorage; mobile: SecureStore). */
  getToken?: () => Promise<string | null> | string | null;
}

async function resolveToken(
  getToken?: ApiClientOptions["getToken"]
): Promise<string | null> {
  if (!getToken) return null;
  return await getToken();
}

/**
 * Client HTTP base usado pelo painel web e pelo app mobile.
 * O backend é o Next.js (app/api/*). Veja frontend/README.md
 * ("Integração com o backend") sobre autenticação/CORS.
 */
export function createApiClient({ baseURL, getToken }: ApiClientOptions) {
  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await resolveToken(getToken);
    const res = await fetch(`${baseURL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers ?? {}),
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const err: ApiError = {
        status: res.status,
        message: body || `Erro ${res.status}`,
      };
      throw err;
    }

    const text = await res.text();
    return (text ? JSON.parse(text) : null) as T;
  }

  return {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
    put: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
    del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
