import { resetPassword } from "./actions";
import { redirect } from "next/navigation";

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
    <main className="max-w-sm mx-auto py-20 px-4">
      <h1 className="text-2xl font-bold mb-4">Redefinir senha</h1>
      <form action={action} className="space-y-3">
        <input type="hidden" name="token" value={searchParams.token ?? ""} />
        <input name="password" type="password" required placeholder="Nova senha" className="w-full border rounded p-2" />
        <button className="w-full bg-black text-white rounded py-2">Salvar nova senha</button>
      </form>
    </main>
  );
}
