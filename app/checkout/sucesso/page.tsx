import { StudentNav } from "@/components/streaming";

export default function CheckoutSuccessPage() {
  return (
    <div className="theme-streaming min-h-screen bg-st-bg text-st-text">
      <StudentNav />
      <main className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-[#46D369]">Pagamento recebido!</h1>
        <p className="mt-3 text-sm text-st-dim">
          Seu acesso será liberado em instantes. Verifique seu email.
        </p>
        <a href="/meus-cursos" className="mt-4 inline-block text-sm text-st-accent-warm underline">
          Ir para meus cursos
        </a>
      </main>
    </div>
  );
}
