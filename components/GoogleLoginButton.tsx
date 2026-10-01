"use client";
import { signIn } from "next-auth/react";

export function GoogleLoginButton() {
  return (
    <button
      onClick={() => signIn("google", { callbackUrl: "/meus-cursos" })}
      className="flex w-full items-center justify-center gap-2 rounded-md border border-st-border bg-st-surface py-2 text-sm text-st-text"
    >
      Entrar com Google
    </button>
  );
}
