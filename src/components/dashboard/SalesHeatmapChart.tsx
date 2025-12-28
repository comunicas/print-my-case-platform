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
import { HeatmapCell, getHeatmapPeak, exportToExcel } from "@/lib/dashboardUtils";
import { formatCurrency } from "@/lib/utils";

interface SalesHeatmapChartProps {
  data: HeatmapCell[];
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8-22
const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function SalesHeatmapChart({ data }: SalesHeatmapChartProps) {
  const { grid, maxRevenue, peak } = useMemo(() => {
    const max = Math.max(...data.map(d => d.revenue), 1);
    const peakData = getHeatmapPeak(data);
    
    // Organiza em grade [hour][day]
    const gridData: (HeatmapCell | undefined)[][] = [];
    for (let h = 0; h < HOURS.length; h++) {
      gridData[h] = [];
      for (let d = 0; d < 7; d++) {
        gridData[h][d] = data.find(cell => cell.hour === HOURS[h] && cell.dayOfWeek === d);
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
  
  const isPeakCell = (hour: number, day: number) => {
    return peak && peak.hour === hour && DAYS[day] === peak.dayName;
  };
  
  const handleExport = () => {
    const exportData: Record<string, any>[] = HOURS.map(hour => {
      const row: Record<string, any> = { Horário: `${hour}:00` };
      DAYS.forEach((day, idx) => {
        const cell = data.find(c => c.hour === hour && c.dayOfWeek === idx);
        row[day] = cell?.revenue || 0;
      });
      return row;
    });
    exportToExcel(exportData, "heatmap-vendas");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between px-4 md:px-6 pt-4 md:pt-6">
        <div className="flex items-center gap-3">
          <CardTitle className="text-base md:text-lg">Vendas por Horário</CardTitle>
          {peak && (
            <Badge variant="outline" className="gap-1 text-xs">
              Pico: {peak.dayName} às {peak.hour}h
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={handleExport} className="gap-1.5">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Exportar</span>
        </Button>
      </CardHeader>
      <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
        {data.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="min-w-[400px]">
              {/* Header - Dias */}
              <div className="grid grid-cols-8 gap-1.5 mb-1.5">
                <div className="text-xs text-muted-foreground text-right pr-1">h</div>
                {DAYS.map(day => (
                  <div key={day} className="text-xs text-muted-foreground text-center font-medium">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Grid */}
              <TooltipProvider>
                {HOURS.map((hour, hIdx) => (
                  <div key={hour} className="grid grid-cols-8 gap-1.5 mb-1.5">
                    <div className="text-xs text-muted-foreground text-right pr-1 leading-7">
                      {hour}h
                    </div>
                    {DAYS.map((day, dIdx) => {
                      const cell = grid[hIdx]?.[dIdx];
                      const revenue = cell?.revenue || 0;
                      const count = cell?.count || 0;
                      
                      return (
                        <Tooltip key={day}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "h-7 rounded cursor-default transition-all",
                                getCellColor(revenue),
                                isPeakCell(hour, dIdx) && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                              )}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs">
                              <p className="font-medium">{day} às {hour}h</p>
                              <p>Receita: {formatCurrency(revenue)}</p>
                              <p>Vendas: {count}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </TooltipProvider>
              
              {/* Legenda melhorada */}
              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                <span>Menos</span>
                <div className="flex gap-1">
                  <div className="w-5 h-5 rounded bg-muted/40 border border-border/50" />
                  <div className="w-5 h-5 rounded bg-purple-100 dark:bg-purple-950/60" />
                  <div className="w-5 h-5 rounded bg-purple-200 dark:bg-purple-900/70" />
                  <div className="w-5 h-5 rounded bg-purple-300 dark:bg-purple-800/80" />
                  <div className="w-5 h-5 rounded bg-purple-400 dark:bg-purple-700" />
                  <div className="w-5 h-5 rounded bg-purple-500 dark:bg-purple-600" />
                </div>
                <span>Mais</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            Nenhum dado disponível
          </div>
        )}
      </CardContent>
    </Card>
  );
}
