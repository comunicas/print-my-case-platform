import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { DollarSign, TrendingUp, Percent, ShoppingCart } from "lucide-react";
import type { MonthSummary } from "@/hooks/useMonthlyDRESummary";

interface ResumoKPICardsProps {
  data: MonthSummary[];
  isLoading?: boolean;
}

function getMarginColor(value: number) {
  if (value >= 20) return "text-emerald-600 dark:text-emerald-400";
  if (value >= 10) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}

function getResultColor(value: number) {
  return value >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive";
}

export function ResumoKPICards({ data, isLoading }: ResumoKPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-7 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Current month is the first item (most recent)
  const current = data[0];
  if (!current) return null;

  const kpis = [
    {
      label: "Receita do Mês",
      value: formatCurrency(current.receita),
      icon: DollarSign,
    },
    {
      label: "Resultado",
      value: formatCurrency(current.resultado),
      icon: TrendingUp,
      colorClass: getResultColor(current.resultado),
    },
    {
      label: "Margem Operacional",
      value: `${current.margem.toFixed(1)}%`,
      icon: Percent,
      colorClass: getMarginColor(current.margem),
    },
    {
      label: "Transações",
      value: current.transacoes.toLocaleString("pt-BR"),
      icon: ShoppingCart,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {kpis.map((kpi) => (
        <Card key={kpi.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <kpi.icon className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">{kpi.label}</span>
            </div>
            <p className={cn("text-lg font-bold tabular-nums", kpi.colorClass)}>
              {kpi.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
