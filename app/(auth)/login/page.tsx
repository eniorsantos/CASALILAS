import { LoginForm } from "@/components/LoginForm";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";

export default function LoginPage() {
  return (
    <main className="max-w-sm mx-auto py-20 px-4 space-y-4">
      <h1 className="text-2xl font-bold">Entrar</h1>
      <LoginForm />
      <GoogleLoginButton />
    </main>
  );
}
