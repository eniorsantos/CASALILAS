import { resetPassword } from "./actions";
import { redirect } from "next/navigation";

const inputClass =
  "w-full rounded-md border border-st-border bg-st-surface px-3 py-2 text-sm text-st-text placeholder:text-st-dim focus:outline-none focus:ring-1 focus:ring-st-accent";

export default function ResetPage({ searchParams }: { searchParams: { token?: string } }) {
  async function action(formData: FormData) {
    "use server";
    const result = await resetPassword(
      searchParams.token ?? (formData.get("token") as string),
      formData.get("password") as string
    );
    if (result.success) redirect("/login");
  }
  return (
    <div className="theme-streaming min-h-screen bg-st-bg text-st-text">
      <main className="mx-auto max-w-sm px-4 py-20">
        <h1 className="mb-4 text-xl font-bold">Redefinir senha</h1>
        <form action={action} className="space-y-3">
          <input type="hidden" name="token" value={searchParams.token ?? ""} />
          <input name="password" type="password" required placeholder="Nova senha" className={inputClass} />
          <button className="w-full rounded bg-st-accent py-2 font-bold text-white">
            Salvar nova senha
          </button>
        </form>
      </main>
    </div>
  );
}
