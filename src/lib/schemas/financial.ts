import { z } from "zod";

export const financialEntrySchema = z.object({
  category: z.enum(["deducoes", "implantacao", "fixas"], {
    required_error: "Selecione a categoria",
  }),
  description: z.string().min(1, "Descrição obrigatória").max(200, "Máximo 200 caracteres"),
  amount: z.number({ required_error: "Valor obrigatório" }).min(0.01, "Valor deve ser maior que zero"),
  reference_month: z.date({ required_error: "Mês de referência obrigatório" }),
  pdv_id: z.string().nullable().optional(),
});

export type FinancialEntryFormData = z.infer<typeof financialEntrySchema>;
