"use client";
import { signIn } from "next-auth/react";

export function GoogleLoginButton() {
  return (
    <button
      onClick={() => signIn("google", { callbackUrl: "/meus-cursos" })}
      className="w-full border rounded-md py-2 flex items-center justify-center gap-2"
    >
      Entrar com Google
    </button>
  );
}
