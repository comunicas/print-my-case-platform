import { z } from "zod";

/**
 * Schema para validação de login
 */
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Schema para recuperação de senha (email)
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

/**
 * Schema para redefinição de senha (nova senha)
 */
export const newPasswordSchema = z.object({
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export type NewPasswordFormData = z.infer<typeof newPasswordSchema>;
