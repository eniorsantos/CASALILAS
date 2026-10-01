import { signIn } from "@/auth";

const inputClass =
  "w-full rounded-md border border-st-border bg-st-surface px-3 py-2 text-sm text-st-text placeholder:text-st-dim focus:outline-none focus:ring-1 focus:ring-st-accent";

export async function LoginForm() {
  async function login(formData: FormData) {
    "use server";
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/meus-cursos",
    });
  }
  return (
    <form action={login} className="space-y-3">
      <input name="email" type="email" required placeholder="Email" className={inputClass} />
      <input name="password" type="password" required placeholder="Senha" className={inputClass} />
      <button className="w-full rounded bg-st-accent py-2 font-bold text-white">Entrar</button>
    </form>
  );
}
