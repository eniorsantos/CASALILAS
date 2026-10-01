import { signup } from "./actions";
import { redirect } from "next/navigation";

const inputClass =
  "w-full rounded-md border border-st-border bg-st-surface px-3 py-2 text-sm text-st-text placeholder:text-st-dim focus:outline-none focus:ring-1 focus:ring-st-accent";

export default function SignupPage() {
  async function action(formData: FormData) {
    "use server";
    const result = await signup(formData);
    if (result.success) redirect("/login");
  }
  return (
    <div className="theme-streaming min-h-screen bg-st-bg text-st-text">
      <main className="mx-auto max-w-sm px-4 py-20">
        <h1 className="mb-4 text-center font-display text-4xl tracking-wide text-st-accent">
          CURSOSFLIX
        </h1>
        <h2 className="mb-4 text-xl font-bold">Criar conta</h2>
        <form action={action} className="space-y-3">
          <input name="name" placeholder="Nome" required className={inputClass} />
          <input name="email" type="email" placeholder="Email" required className={inputClass} />
          <input name="password" type="password" placeholder="Senha (mín. 8)" required className={inputClass} />
          <button className="w-full rounded bg-st-accent py-2 font-bold text-white">Cadastrar</button>
        </form>
      </main>
    </div>
  );
}
