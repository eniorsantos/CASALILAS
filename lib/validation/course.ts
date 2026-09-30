import { z } from "zod";

/**
 * Schema de curso compartilhado entre Server Actions e formulários client
 * (seção 6.1 da especificação). Fonte única de verdade — nunca duplicar
 * essas regras em outro lugar.
 */
export const courseSchema = z.object({
  title: z.string().min(3, "Título muito curto"),
  description: z.string().min(10, "Descreva melhor o curso"),
  priceCents: z.coerce.number().int().min(0),
});

export type CourseFormData = z.infer<typeof courseSchema>;
