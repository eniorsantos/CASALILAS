import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "../shared";
import { getStoredUser, login as doLogin, logout as doLogout, signup as doSignup } from "../auth/session";
import { exchangeSocialToken } from "../auth/social";
import { registerForPush } from "../push/notifications";
import { api } from "../api/client";

/** Registra o device p/ push após login (falha silenciosa: sem rede, sem token). */
async function syncPushToken(): Promise<void> {
  try {
    const pushToken = await registerForPush();
    if (pushToken) {
      await api.post("/api/mobile/push-token", { token: pushToken, platform: "mobile" });
    }
  } catch {
    // sem permissão/rede — tenta de novo ao ligar o toggle no perfil
  }
}

interface SessionValue {
  user: User | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInSocial: (provider: "google" | "apple", idToken: string, extra?: { email?: string; name?: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getStoredUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setUser(await doLogin(email, password));
    void syncPushToken();
  }, []);
  const signUp = useCallback(async (name: string, email: string, password: string) => {
    setUser(await doSignup(name, email, password));
  }, []);
  const signInSocial = useCallback(
    async (provider: "google" | "apple", idToken: string, extra?: { email?: string; name?: string }) => {
      setUser(await exchangeSocialToken(provider, idToken, extra));
      void syncPushToken();
    },
    []
  );
  const signOut = useCallback(async () => {
    await doLogout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, signIn, signUp, signInSocial, signOut }),
    [user, ready, signIn, signUp, signInSocial, signOut]
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession fora do SessionProvider");
  return ctx;
}
