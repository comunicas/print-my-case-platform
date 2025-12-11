import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function getVariationIcon(variation: number) {
  if (variation > 0) return TrendingUp;
  if (variation < 0) return TrendingDown;
  return Minus;
}

export function getVariationColor(variation: number) {
  if (variation > 0) return "text-emerald-500";
  if (variation < 0) return "text-destructive";
  return "text-muted-foreground";
}

export function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatNumber(value: number) {
  return value.toLocaleString("pt-BR");
}
