import { LoginForm } from "@/components/LoginForm";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";

export default function LoginPage() {
  return (
    <div className="theme-streaming min-h-screen bg-st-bg text-st-text">
      <main className="mx-auto max-w-sm space-y-4 px-4 py-20">
        <h1 className="text-center font-display text-4xl tracking-wide text-st-accent">
          CURSOSFLIX
        </h1>
        <h2 className="text-center text-xl font-bold">Entrar</h2>
        <LoginForm />
        <GoogleLoginButton />
      </main>
    </div>
  );
}
