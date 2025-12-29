import { z } from "zod";

export const organizationSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  cnpj: z.string().optional().nullable(),
  email: z.string().email("Email inválido").optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  plan: z.string().optional().nullable(),
});

export type OrganizationFormData = z.infer<typeof organizationSchema>;
