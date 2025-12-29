import { useMemo } from "react";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { HeatmapCell, TIME_RANGES, getHeatmapPeak, exportToExcel } from "@/lib/dashboardUtils";
import { formatCurrency } from "@/lib/utils";

interface SalesHeatmapChartProps {
  data: HeatmapCell[];
}

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function SalesHeatmapChart({ data }: SalesHeatmapChartProps) {
  const { grid, maxRevenue, peak } = useMemo(() => {
    const max = Math.max(...data.map(d => d.revenue), 1);
    const peakData = getHeatmapPeak(data);
    
    // Organiza em grade [rangeId][day]
    const gridData: (HeatmapCell | undefined)[][] = [];
    for (let r = 0; r < TIME_RANGES.length; r++) {
      gridData[r] = [];
      for (let d = 0; d < 7; d++) {
        gridData[r][d] = data.find(cell => cell.rangeId === r && cell.dayOfWeek === d);
      }
    }
    
    return { grid: gridData, maxRevenue: max, peak: peakData };
  }, [data]);
  
  // Cores com gradiente de luminosidade para melhor visibilidade
  const getCellColor = (revenue: number) => {
    if (revenue === 0 || maxRevenue === 0) return "bg-muted/40";
    const ratio = revenue / maxRevenue;
    // Gradiente de cinza claro → roxo escuro para melhor contraste
    if (ratio < 0.15) return "bg-purple-100 dark:bg-purple-950/60";
    if (ratio < 0.30) return "bg-purple-200 dark:bg-purple-900/70";
    if (ratio < 0.50) return "bg-purple-300 dark:bg-purple-800/80";
    if (ratio < 0.75) return "bg-purple-400 dark:bg-purple-700";
    return "bg-purple-500 dark:bg-purple-600";
  };
  
  const isPeakCell = (rangeId: number, day: number) => {
    if (!peak) return false;
    const range = TIME_RANGES[rangeId];
    return range.label === peak.rangeLabel && DAYS[day] === peak.dayName;
  };
  
  const handleExport = () => {
    const exportData: Record<string, any>[] = TIME_RANGES.map(range => {
      const row: Record<string, any> = { Horário: range.label };
      DAYS.forEach((day, idx) => {
        const cell = data.find(c => c.rangeId === range.id && c.dayOfWeek === idx);
        row[day] = cell?.revenue || 0;
      });
      return row;
    });
    exportToExcel(exportData, "heatmap-vendas");
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between px-4 md:px-6 pt-4 md:pt-6 pb-3">
        <div className="flex items-center gap-3">
          <CardTitle className="text-base md:text-lg">Vendas por Horário</CardTitle>
          {peak && (
            <Badge variant="outline" className="gap-1 text-xs">
              Pico: {peak.dayName} {peak.rangeLabel}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={handleExport} className="gap-1.5">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Exportar</span>
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col px-4 md:px-6 pb-4 md:pb-6">
        {data.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="min-w-[400px]">
              {/* Header - Dias */}
              <div className="grid grid-cols-8 gap-1 mb-1">
                <div className="text-xs text-muted-foreground text-right pr-1"></div>
                {DAYS.map(day => (
                  <div key={day} className="text-xs text-muted-foreground text-center font-medium">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Grid - 5 faixas horárias */}
              <TooltipProvider>
                {TIME_RANGES.map((range, rIdx) => (
                  <div key={range.id} className="grid grid-cols-8 gap-1 mb-1">
                    <div className="text-xs text-muted-foreground text-right pr-1 leading-8">
                      {range.label}
                    </div>
                    {DAYS.map((day, dIdx) => {
                      const cell = grid[rIdx]?.[dIdx];
                      const revenue = cell?.revenue || 0;
                      const count = cell?.count || 0;
                      
                      return (
                        <Tooltip key={day}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "h-8 rounded cursor-default transition-all",
                                getCellColor(revenue),
                                isPeakCell(rIdx, dIdx) && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                              )}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="flex flex-col gap-1">
                              <span className="font-medium text-sm">{day} {range.label}</span>
                              <span className="text-xs">Receita: {formatCurrency(revenue)}</span>
                              <span className="text-xs text-muted-foreground">{count} vendas</span>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </TooltipProvider>
              
              {/* Legenda */}
              <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
                <span>Menos</span>
                <div className="flex gap-0.5">
                  <div className="w-4 h-4 rounded bg-muted/40 border border-border/50" />
                  <div className="w-4 h-4 rounded bg-purple-100 dark:bg-purple-950/60" />
                  <div className="w-4 h-4 rounded bg-purple-200 dark:bg-purple-900/70" />
                  <div className="w-4 h-4 rounded bg-purple-300 dark:bg-purple-800/80" />
                  <div className="w-4 h-4 rounded bg-purple-400 dark:bg-purple-700" />
                  <div className="w-4 h-4 rounded bg-purple-500 dark:bg-purple-600" />
                </div>
                <span>Mais</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-[150px] flex items-center justify-center text-muted-foreground">
            Nenhum dado disponível
          </div>
        )}
      </CardContent>
    </Card>
  );
}
