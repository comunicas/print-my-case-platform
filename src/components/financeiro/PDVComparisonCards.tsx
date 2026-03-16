import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";
import type { PDVComparisonData } from "@/hooks/usePDVComparison";

interface PDVComparisonCardsProps {
  data: PDVComparisonData[];
  isLoading?: boolean;
}

function getMarginColor(value: number) {
  if (value >= 20) return "text-emerald-600 dark:text-emerald-400";
  if (value >= 10) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}

export function PDVComparisonCards({ data, isLoading }: PDVComparisonCardsProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Comparativo por PDV (mês atual)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="py-4 px-4 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        Comparativo por PDV (mês atual)
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.map((pdv) => (
          <Card key={pdv.pdvId}>
            <CardContent className="py-4 px-4">
              <p className="font-medium text-sm truncate mb-2">{pdv.pdvName}</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Receita</span>
                  <span className="font-medium tabular-nums">{formatCurrency(pdv.receita)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resultado</span>
                  <span className={cn("font-medium tabular-nums", pdv.resultado >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
                    {formatCurrency(pdv.resultado)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Margem</span>
                  <span className={cn("font-medium tabular-nums", getMarginColor(pdv.margem))}>
                    {pdv.margem.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transações</span>
                  <span className="font-medium tabular-nums">{pdv.transacoes}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
