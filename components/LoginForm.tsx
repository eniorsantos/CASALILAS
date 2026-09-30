import { signIn } from "@/auth";

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
      <input name="email" type="email" required placeholder="Email" className="w-full border rounded p-2" />
      <input name="password" type="password" required placeholder="Senha" className="w-full border rounded p-2" />
      <button className="w-full bg-black text-white rounded py-2">Entrar</button>
    </form>
  );
}
