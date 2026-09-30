/** Formata centavos (Int do banco) em moeda BRL. */
export function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("pt-BR");
}

export function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString("pt-BR");
}
