import { z } from "zod";

export const pdvFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, { message: "Nome deve ter pelo menos 3 caracteres" })
    .max(100, { message: "Nome deve ter no máximo 100 caracteres" }),
  location: z
    .string()
    .trim()
    .min(3, { message: "Localização deve ter pelo menos 3 caracteres" })
    .max(100, { message: "Localização deve ter no máximo 100 caracteres" }),
  machineId: z
    .string()
    .trim()
    .min(3, { message: "ID da máquina deve ter pelo menos 3 caracteres" })
    .max(20, { message: "ID da máquina deve ter no máximo 20 caracteres" })
    .regex(/^[A-Za-z0-9-]+$/, {
      message: "ID da máquina deve conter apenas letras, números e hífens",
    }),
  status: z.enum(["active", "inactive"]),
});

export type PDVFormData = z.infer<typeof pdvFormSchema>;
