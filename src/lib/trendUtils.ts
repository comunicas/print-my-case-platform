import { format, subDays, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface TrendData {
  percentage: number | null;
  hasPreviousData: boolean;
  isPositive: boolean;
  currentPeriod: { start: Date; end: Date };
  previousPeriod: { start: Date; end: Date };
  currentValue: number;
  previousValue: number;
}

/**
 * Calcula a variação percentual entre dois valores
 */
export function calculatePercentageChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10; // 1 casa decimal
}

/**
 * Obtém o período anterior com a mesma duração
 */
export function getPreviousPeriod(startDate: Date, endDate: Date): { start: Date; end: Date } {
  const days = differenceInDays(endDate, startDate) + 1;
  return {
    start: subDays(startDate, days),
    end: subDays(startDate, 1),
  };
}

/**
 * Calcula a tendência completa com dados do período anterior
 */
export function calculateTrend(
  currentValue: number,
  previousValue: number,
  startDate: Date,
  endDate: Date
): TrendData {
  const previousPeriod = getPreviousPeriod(startDate, endDate);
  const percentage = calculatePercentageChange(currentValue, previousValue);
  
  return {
    percentage,
    hasPreviousData: previousValue > 0,
    isPositive: percentage !== null && percentage >= 0,
    currentPeriod: { start: startDate, end: endDate },
    previousPeriod,
    currentValue,
    previousValue,
  };
}

/**
 * Formata o texto do tooltip de tendência
 */
export function formatTrendTooltip(trend: TrendData, label: string): string {
  const formatDate = (date: Date) => format(date, "dd/MM", { locale: ptBR });
  
  const currentPeriodStr = `${formatDate(trend.currentPeriod.start)} - ${formatDate(trend.currentPeriod.end)}`;
  const previousPeriodStr = `${formatDate(trend.previousPeriod.start)} - ${formatDate(trend.previousPeriod.end)}`;
  
  if (!trend.hasPreviousData) {
    return `Período: ${currentPeriodStr}\nSem dados do período anterior para comparação.`;
  }
  
  return `${label}:
Período atual (${currentPeriodStr}): ${formatTrendValue(trend.currentValue, label)}
Período anterior (${previousPeriodStr}): ${formatTrendValue(trend.previousValue, label)}
Variação: ${trend.percentage !== null ? `${trend.percentage > 0 ? '+' : ''}${trend.percentage}%` : 'N/A'}`;
}

function formatTrendValue(value: number, label: string): string {
  if (label.toLowerCase().includes("receita") || label.toLowerCase().includes("ticket")) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  }
  return value.toLocaleString("pt-BR");
}

/**
 * Formata o badge de tendência
 */
export function formatTrendBadge(percentage: number | null): string {
  if (percentage === null) return "N/A";
  const sign = percentage > 0 ? "+" : "";
  return `${sign}${percentage}%`;
}
