import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Building2, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FinancialSummaryCardProps {
  margemOperacional: number; // percentage
  custoporMaquina: number; // currency
  taxaPerda: number; // percentage
  isLoading?: boolean;
}

function getMarginColor(value: number) {
  if (value >= 20) return "text-emerald-600 dark:text-emerald-400";
  if (value >= 10) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}

function getLossColor(value: number) {
  if (value <= 2) return "text-emerald-600 dark:text-emerald-400";
  if (value <= 5) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}

export function FinancialSummaryCard({
  margemOperacional,
  custoporMaquina,
  taxaPerda,
  isLoading,
}: FinancialSummaryCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-4 px-4 md:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                  <div className="h-5 w-16 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const indicators = [
    {
      label: "Margem Operacional",
      value: `${margemOperacional.toFixed(1)}%`,
      icon: TrendingUp,
      colorClass: getMarginColor(margemOperacional),
      bgClass: "bg-primary/10",
      iconColor: "text-primary",
      tooltip: "Resultado Operacional ÷ Receita Líquida × 100\nVerde ≥ 20% · Amarelo ≥ 10% · Vermelho < 10%",
    },
    {
      label: "Custo por Máquina",
      value: formatCurrency(custoporMaquina),
      icon: Building2,
      colorClass: "text-foreground",
      bgClass: "bg-secondary",
      iconColor: "text-muted-foreground",
      tooltip: "(CMV + Taxas + Despesas Fixas) ÷ Nº de PDVs ativos",
    },
    {
      label: "Taxa de Perda",
      value: `${taxaPerda.toFixed(1)}%`,
      icon: AlertTriangle,
      colorClass: getLossColor(taxaPerda),
      bgClass: "bg-destructive/10",
      iconColor: "text-destructive",
      tooltip: "(Cancelamentos + Estornos) ÷ Receita Bruta × 100\nVerde ≤ 2% · Amarelo ≤ 5% · Vermelho > 5%",
    },
  ];

  return (
    <Card>
      <CardContent className="py-4 px-4 md:px-6">
        <TooltipProvider>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {indicators.map((ind) => (
              <Tooltip key={ind.label}>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-3 cursor-help">
                    <div className={cn("flex items-center justify-center h-9 w-9 rounded-lg shrink-0", ind.bgClass)}>
                      <ind.icon className={cn("h-4 w-4", ind.iconColor)} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground truncate">{ind.label}</p>
                      <p className={cn("text-base font-semibold", ind.colorClass)}>{ind.value}</p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs whitespace-pre-line text-left">
                  {ind.tooltip}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
