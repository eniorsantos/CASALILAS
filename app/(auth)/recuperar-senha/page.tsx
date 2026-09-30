import { requestPasswordReset } from "./actions";

export default function RecoverPage() {
  async function action(formData: FormData) {
    "use server";
    await requestPasswordReset(formData.get("email") as string);
  }
  return (
    <main className="max-w-sm mx-auto py-20 px-4">
      <h1 className="text-2xl font-bold mb-4">Recuperar senha</h1>
      <form action={action} className="space-y-3">
        <input name="email" type="email" required placeholder="Seu email" className="w-full border rounded p-2" />
        <button className="w-full bg-black text-white rounded py-2">Enviar link</button>
      </form>
      <p className="text-sm text-gray-500 mt-3">Se o email existir, você receberá um link em instantes.</p>
    </main>
  );
}
