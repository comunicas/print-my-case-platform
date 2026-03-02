import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnnualDRE } from "@/hooks/useAnnualDRE";
import { AnnualKPICards } from "./AnnualKPICards";
import { RevenueEvolutionChart } from "./RevenueEvolutionChart";
import { MarginsChart } from "./MarginsChart";
import { CostCompositionChart } from "./CostCompositionChart";

interface AnnualSummaryProps {
  pdvId?: string | null;
}

export function AnnualSummary({ pdvId }: AnnualSummaryProps) {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const { monthlyData, kpis, isLoading } = useAnnualDRE({ year, pdvId });

  return (
    <div className="space-y-4">
      {/* Year selector */}
      <div className="flex items-center justify-center gap-3">
        <Button variant="outline" size="icon" onClick={() => setYear((y) => y - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium min-w-[80px] text-center">{year}</span>
        <Button variant="outline" size="icon" onClick={() => setYear((y) => y + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <AnnualKPICards kpis={kpis} isLoading={isLoading} />

      <div className="space-y-4">
        <RevenueEvolutionChart data={monthlyData} />
        <MarginsChart data={monthlyData} />
        <CostCompositionChart data={monthlyData} />
      </div>

      {!isLoading && monthlyData.every((m) => m.receitaBruta === 0) && (
        <p className="text-center text-sm text-muted-foreground py-8">
          Nenhum dado de vendas encontrado para {year}.
        </p>
      )}
    </div>
  );
}
