export default function CheckoutSuccessPage() {
  return (
    <main className="max-w-lg mx-auto py-20 text-center px-4">
      <h1 className="text-2xl font-bold text-green-600">Pagamento recebido!</h1>
      <p className="mt-3">Seu acesso será liberado em instantes. Verifique seu email.</p>
      <a href="/meus-cursos" className="underline mt-4 inline-block">Ir para meus cursos</a>
    </main>
  );
}
