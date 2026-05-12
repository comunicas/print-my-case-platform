/**
 * Cores semânticas compartilhadas pelos componentes do módulo Financeiro.
 * Usa tokens DS (`text-success`, `text-warning`, `text-destructive`) — nunca cores literais.
 */

export function getMarginColor(value: number): string {
  if (value >= 20) return "text-success";
  if (value >= 10) return "text-warning";
  return "text-destructive";
}

export function getResultColor(value: number): string {
  return value >= 0 ? "text-success" : "text-destructive";
}

/** Cor da borda lateral (supporting indicator) baseada na margem. */
export function getMarginBorderColor(value: number): string {
  if (value >= 20) return "border-l-success";
  if (value >= 10) return "border-l-warning";
  return "border-l-destructive";
}