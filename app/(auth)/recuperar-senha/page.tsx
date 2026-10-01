import { requestPasswordReset } from "./actions";

const inputClass =
  "w-full rounded-md border border-st-border bg-st-surface px-3 py-2 text-sm text-st-text placeholder:text-st-dim focus:outline-none focus:ring-1 focus:ring-st-accent";

export default function RecoverPage() {
  async function action(formData: FormData) {
    "use server";
    await requestPasswordReset(formData.get("email") as string);
  }
  return (
    <div className="theme-streaming min-h-screen bg-st-bg text-st-text">
      <main className="mx-auto max-w-sm px-4 py-20">
        <h1 className="mb-4 text-xl font-bold">Recuperar senha</h1>
        <form action={action} className="space-y-3">
          <input name="email" type="email" required placeholder="Seu email" className={inputClass} />
          <button className="w-full rounded bg-st-accent py-2 font-bold text-white">Enviar link</button>
        </form>
        <p className="mt-3 text-xs text-st-dim">
          Se o email existir, você receberá um link em instantes.
        </p>
      </main>
    </div>
  );
}
