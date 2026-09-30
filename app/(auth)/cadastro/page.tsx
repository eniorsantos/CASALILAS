import { signup } from "./actions";
import { redirect } from "next/navigation";

export default function SignupPage() {
  async function action(formData: FormData) {
    "use server";
    const result = await signup(formData);
    if (result.success) redirect("/login");
  }
  return (
    <main className="max-w-sm mx-auto py-20 px-4">
      <h1 className="text-2xl font-bold mb-4">Criar conta</h1>
      <form action={action} className="space-y-3">
        <input name="name" placeholder="Nome" required className="w-full border rounded p-2" />
        <input name="email" type="email" placeholder="Email" required className="w-full border rounded p-2" />
        <input name="password" type="password" placeholder="Senha (mín. 8)" required className="w-full border rounded p-2" />
        <button className="w-full bg-black text-white rounded py-2">Cadastrar</button>
      </form>
    </main>
  );
}
