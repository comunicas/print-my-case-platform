import { z } from "zod";

export const profileFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  phone: z.string().optional(),
});

export const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  newPassword: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export const organizationFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const preferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  language: z.enum(["pt-BR", "en", "es"]),
  notifications: z.object({
    email: z.boolean(),
    stockAlerts: z.boolean(),
    weeklyReports: z.boolean(),
    uploadProcessed: z.boolean(),
  }),
  dashboard: z.object({
    defaultPeriod: z.enum(["today", "7days", "30days", "thisMonth"]),
    defaultPdv: z.string(),
  }),
});

export type ProfileFormData = z.infer<typeof profileFormSchema>;
export type PasswordFormData = z.infer<typeof passwordFormSchema>;
export type OrganizationFormData = z.infer<typeof organizationFormSchema>;
export type PreferencesData = z.infer<typeof preferencesSchema>;
