import * as AppleAuthentication from "expo-apple-authentication";
import { Platform } from "react-native";
import { API_URL } from "../api/client";
import { saveSession } from "./session";
import type { User } from "../shared";

/**
 * Login social (spec §3): Google via expo-auth-session (id_token, sem secret
 * no app) e Apple via expo-apple-authentication (só iOS). Ambos trocam o
 * idToken pelo nosso JWT 30d em POST /api/mobile/social-login.
 */
export async function exchangeSocialToken(
  provider: "google" | "apple",
  idToken: string,
  extra?: { email?: string; name?: string }
): Promise<User> {
  const res = await fetch(`${API_URL}/api/mobile/social-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, idToken, ...extra }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(body || "Login social falhou");
  }
  const data = (await res.json()) as { token: string; user: User };
  await saveSession(data.token, data.user);
  return data.user;
}

export async function signInWithApple(): Promise<{ idToken: string; email?: string; name?: string }> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
    ],
  });
  if (!credential.identityToken) throw new Error("Apple não retornou identityToken");
  const name = credential.fullName?.givenName
    ? `${credential.fullName.givenName} ${credential.fullName.familyName ?? ""}`.trim()
    : undefined;
  // NOTE: a Apple só envia email/nome no PRIMEIRO login — depois vêm vazios.
  return { idToken: credential.identityToken, email: credential.email ?? undefined, name };
}

export function appleAuthAvailable(): boolean {
  return Platform.OS === "ios";
}
