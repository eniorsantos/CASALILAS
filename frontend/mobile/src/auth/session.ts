import * as SecureStore from "expo-secure-store";
import type { User } from "../shared";
import { API_URL } from "../api/client";

const TOKEN_KEY = "plataforma.auth_token";
const USER_KEY = "plataforma.auth_user";

export async function saveSession(token: string, user: User): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

/** Login via JWT (nunca cookie) — POST /api/mobile/login do backend. */
export async function login(email: string, password: string): Promise<User> {
  const res = await fetch(`${API_URL}/api/mobile/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Credenciais inválidas");
  const data = (await res.json()) as { token: string; user: User };
  await SecureStore.setItemAsync(TOKEN_KEY, data.token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
  return data.user;
}

export async function signup(name: string, email: string, password: string): Promise<User> {
  const res = await fetch(`${API_URL}/api/mobile/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(body || "Não foi possível criar a conta");
  }
  const data = (await res.json()) as { token: string; user: User };
  await SecureStore.setItemAsync(TOKEN_KEY, data.token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
  return data.user;
}

export async function getStoredUser(): Promise<User | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
}

export async function logout(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export async function getAuthHeader(): Promise<{ Authorization: string } | Record<string, never>> {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
