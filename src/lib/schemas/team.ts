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
  super_admin: "Super Admin",
  org_admin: "Administrador",
  operator: "Operador",
  viewer: "Visualizador",
};

export const roleBadgeVariants: Record<TeamMemberRole, "default" | "secondary" | "outline"> = {
  super_admin: "default",
  org_admin: "default",
  operator: "secondary",
  viewer: "outline",
};

export const statusLabels: Record<TeamMemberStatus, string> = {
  active: "Ativo",
  pending: "Pendente",
  inactive: "Inativo",
};

export const rolePermissions: Record<TeamMemberRole, string[]> = {
  super_admin: [
    "Acesso total ao sistema",
    "Gerenciar usuários e permissões",
    "Configurar organizações",
    "Gerenciar PDVs e uploads",
    "Visualizar relatórios completos",
  ],
  org_admin: [
    "Gerenciar usuários da organização",
    "Gerenciar PDVs e uploads",
    "Visualizar relatórios da organização",
    "Configurar preferências",
  ],
  operator: [
    "Acessar PDVs atribuídos",
    "Fazer uploads de arquivos",
    "Visualizar relatórios básicos",
  ],
  viewer: [
    "Visualizar PDVs",
    "Visualizar relatórios básicos",
    "Apenas leitura",
  ],
};
