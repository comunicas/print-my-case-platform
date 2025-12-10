import { z } from "zod";

export const teamMemberFormSchema = z.object({
  name: z.string().trim()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.string().trim().email("Email inválido"),
  role: z.enum(["super_admin", "org_admin", "operator", "viewer"], {
    required_error: "Selecione uma função",
  }),
  status: z.enum(["active", "pending", "inactive"], {
    required_error: "Selecione um status",
  }),
});

export type TeamMemberFormData = z.infer<typeof teamMemberFormSchema>;

export type TeamMemberRole = TeamMemberFormData["role"];
export type TeamMemberStatus = TeamMemberFormData["status"];

export const roleLabels: Record<TeamMemberRole, string> = {
  super_admin: "Administrador",
  org_admin: "Administrador",
  operator: "Operador",
  viewer: "Visualizador",
};

export const statusLabels: Record<TeamMemberStatus, string> = {
  active: "Ativo",
  pending: "Pendente",
  inactive: "Inativo",
};
