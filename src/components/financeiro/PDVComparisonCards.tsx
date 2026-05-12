import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, cn } from "@/lib/utils";
import { Building2 } from "lucide-react";
import type { PDVComparisonData } from "@/hooks/usePDVComparison";
import { getMarginColor, getResultColor, getMarginBorderColor } from "./colorUtils";

interface PDVComparisonCardsProps {
  data: PDVComparisonData[];
  isLoading?: boolean;
}

function SectionHeader() {
  return (
    <h3 className="md-title-small uppercase tracking-wider text-muted-foreground flex items-center gap-2">
      <Building2 className="h-4 w-4" />
      Comparativo por PDV (mês atual)
    </h3>
  );
}

export function PDVComparisonCards({ data, isLoading }: PDVComparisonCardsProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <SectionHeader />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2].map((i) => (
            <Card key={i} className="min-w-0 border-l-4 border-l-muted">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-7 w-28" />
                <div className="grid grid-cols-3 gap-2">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
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
      <SectionHeader />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {data.map((pdv) => (
          <PDVCard key={pdv.pdvId} pdv={pdv} />
        ))}
      </div>
    </div>
  );
}

function PDVCard({ pdv }: { pdv: PDVComparisonData }) {
  return (
    <Card className={cn("min-w-0 border-l-4", getMarginBorderColor(pdv.margem))}>
      <CardContent className="p-4 space-y-3">
        {/* Nome do PDV */}
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="md-title-medium truncate" title={pdv.pdvName}>
            {pdv.pdvName}
          </p>
        </div>

        {/* KPI primário: Receita Bruta + Receita Líquida */}
        <div className="space-y-0.5 min-w-0">
          <p className="md-label-small uppercase tracking-wider text-muted-foreground">
            Receita
          </p>
          <p className="md-headline-small tabular-nums text-foreground truncate">
            {formatCurrency(pdv.receita)}
          </p>
          <p className="md-label-small text-muted-foreground tabular-nums truncate">
            Líquida: {formatCurrency(pdv.receitaLiquida)}
          </p>
        </div>

        {/* Sub-métricas — lista vertical garante leitura em qualquer largura */}
        <div className="pt-2 border-t border-border space-y-1.5">
          <Row
            label="Resultado"
            value={formatCurrency(pdv.resultado)}
            colorClass={getResultColor(pdv.resultado)}
          />
          <Row
            label="Margem"
            value={`${pdv.margem.toFixed(1)}%`}
            colorClass={getMarginColor(pdv.margem)}
          />
          <Row
            label="Transações"
            value={pdv.transacoes.toLocaleString("pt-BR")}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: string;
  colorClass?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 min-w-0">
      <span className="md-label-small uppercase tracking-wider text-muted-foreground shrink-0">
        {label}
      </span>
      <span
        className={cn(
          "md-title-small tabular-nums text-right truncate",
          colorClass ?? "text-foreground"
        )}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}
