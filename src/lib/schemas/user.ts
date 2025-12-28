import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  // Escolher entre criar nova organização ou usar existente
  createNewOrganization: z.boolean().default(true),
  organizationId: z.string().uuid().optional(),
  organizationName: z.string().optional(),
  // Role do novo usuário
  role: z.enum(["org_admin", "operator", "viewer"]).default("org_admin"),
}).refine(data => {
  if (data.createNewOrganization) {
    return true; // organizationName é opcional, usa nome do usuário se vazio
  }
  return !!data.organizationId; // Se não criar nova, precisa selecionar existente
}, {
  message: "Selecione uma organização existente",
  path: ["organizationId"],
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;
