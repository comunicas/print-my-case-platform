import { DollarSign, TrendingUp, Percent, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { AnnualKPIs } from "@/hooks/useAnnualDRE";
import { cn } from "@/lib/utils";

interface AnnualKPICardsProps {
  kpis: AnnualKPIs;
  isLoading: boolean;
  monthsWithData?: number;
}

export function AnnualKPICards({ kpis, isLoading, monthsWithData = 0 }: AnnualKPICardsProps) {
  const hasData = monthsWithData > 0;

  const cards = [
    {
      label: "Receita Bruta",
      value: hasData ? formatCurrency(kpis.receitaBrutaTotal) : "—",
      icon: DollarSign,
      color: "text-chart-1",
    },
    {
      label: "Resultado Operacional",
      value: hasData ? formatCurrency(kpis.resultadoOperacionalTotal) : "—",
      icon: TrendingUp,
      color: hasData && kpis.resultadoOperacionalTotal < 0 ? "text-destructive" : "text-chart-2",
    },
    {
      label: "Margem Bruta Média",
      value: hasData ? `${kpis.margemBrutaMedia.toFixed(1)}%` : "—",
      icon: Percent,
      color: "text-chart-3",
    },
    {
      label: "Margem Operacional Média",
      value: hasData ? `${kpis.margemOperacionalMedia.toFixed(1)}%` : "—",
      icon: Target,
      color: hasData && kpis.margemOperacionalMedia < 0 ? "text-destructive" : "text-chart-4",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <card.icon className={cn("h-4 w-4", card.color)} />
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
            {isLoading ? (
              <div className="h-7 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <p className="text-lg font-bold">{card.value}</p>
                {hasData && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {monthsWithData} {monthsWithData === 1 ? "mês" : "meses"} com dados
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
