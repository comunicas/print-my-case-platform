import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { SafeParseReturnType } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("pt-BR").format(value);

/**
 * Parse Zod validation errors into a Record<string, string> for form error handling
 */
export function parseZodErrors<T>(result: SafeParseReturnType<T, T>): Record<string, string> | null {
  if (result.success) return null;
  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    if (err.path[0]) {
      errors[err.path[0] as string] = err.message;
    }
  });
  return errors;
}

/**
 * Get initials from a name (e.g., "John Doe" -> "JD")
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Returns singular or plural form based on count
 * @example pluralize(1, 'venda', 'vendas') => '1 venda'
 * @example pluralize(5, 'unidade', 'unidades') => '5 unidades'
 */
export function pluralize(
  count: number,
  singular: string,
  plural: string
): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
