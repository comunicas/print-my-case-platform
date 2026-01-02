import { z } from "zod";

export const productRequestSchema = z.object({
  customerName: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  customerPhone: z
    .string()
    .regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, "WhatsApp inválido"),
  requestedModel: z
    .string()
    .min(2, "Modelo deve ter pelo menos 2 caracteres")
    .max(200, "Modelo deve ter no máximo 200 caracteres"),
});

export type ProductRequestFormData = z.infer<typeof productRequestSchema>;
