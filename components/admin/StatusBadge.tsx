import { Badge } from "@/components/ui/badge";

const STATUS_VARIANT: Record<string, "success" | "warning" | "default" | "accent" | "danger" | "outline"> = {
  PUBLISHED: "success",
  DRAFT: "warning",
  ARCHIVED: "default",
  ACTIVE: "success",
  EXPIRED: "default",
  CANCELED: "danger",
  PAST_DUE: "warning",
  PAID: "success",
  PENDING: "warning",
  FAILED: "danger",
  REFUNDED: "default",
};

const STATUS_LABEL: Record<string, string> = {
  PUBLISHED: "Publicado",
  DRAFT: "Rascunho",
  ARCHIVED: "Arquivado",
  ACTIVE: "Ativo",
  EXPIRED: "Expirado",
  CANCELED: "Cancelado",
  PAST_DUE: "Em atraso",
  PAID: "Pago",
  PENDING: "Pendente",
  FAILED: "Falhou",
  REFUNDED: "Reembolsado",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? "default"}>
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}
