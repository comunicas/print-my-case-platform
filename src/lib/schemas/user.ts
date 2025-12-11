import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  organizationName: z.string().optional(),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;
