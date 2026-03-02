import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  const [showFullYear, setShowFullYear] = useState(false);
  const { monthlyData, kpis, isLoading } = useAnnualDRE({ year, pdvId });

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-11

  const displayData = useMemo(() => {
    if (showFullYear || year < currentYear) return monthlyData;
    if (year === currentYear) return monthlyData.filter((m) => m.monthIndex <= currentMonth);
    return []; // future year
  }, [monthlyData, year, currentYear, currentMonth, showFullYear]);

  const monthsWithData = displayData.filter((m) => m.receitaBruta > 0).length;

  return (
    <div className="space-y-4">
      {/* Year selector */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <Button variant="outline" size="icon" onClick={() => setYear((y) => y - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium min-w-[80px] text-center">{year}</span>
        <Button variant="outline" size="icon" onClick={() => setYear((y) => y + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 ml-2">
          <Switch id="full-year" checked={showFullYear} onCheckedChange={setShowFullYear} />
          <Label htmlFor="full-year" className="text-xs text-muted-foreground cursor-pointer">
            Ano completo
          </Label>
        </div>
      </div>

      <AnnualKPICards kpis={kpis} isLoading={isLoading} monthsWithData={monthsWithData} />

      <div className="space-y-4">
        <RevenueEvolutionChart data={displayData} />
        <MarginsChart data={displayData} />
        <CostCompositionChart data={displayData} />
      </div>

      {!isLoading && displayData.every((m) => m.receitaBruta === 0) && (
        <p className="text-center text-sm text-muted-foreground py-8">
          Nenhum dado de vendas encontrado para {year}.
        </p>
      )}
    </div>
  );
}
