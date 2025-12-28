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
  
  const getCellColor = (revenue: number) => {
    if (revenue === 0 || maxRevenue === 0) return "bg-muted/30";
    const ratio = revenue / maxRevenue;
    if (ratio < 0.15) return "bg-chart-1/20";
    if (ratio < 0.30) return "bg-chart-1/40";
    if (ratio < 0.50) return "bg-chart-1/60";
    if (ratio < 0.75) return "bg-chart-1/80";
    return "bg-chart-1";
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
              <div className="grid grid-cols-8 gap-1 mb-1">
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
                  <div key={hour} className="grid grid-cols-8 gap-1 mb-1">
                    <div className="text-xs text-muted-foreground text-right pr-1 leading-6">
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
                                "h-6 rounded-sm cursor-default transition-all",
                                getCellColor(revenue),
                                isPeakCell(hour, dIdx) && "ring-2 ring-primary ring-offset-1"
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
              
              {/* Legenda */}
              <div className="flex items-center justify-center gap-1 mt-4 text-xs text-muted-foreground">
                <span>Menos</span>
                <div className="flex gap-0.5">
                  <div className="w-4 h-4 rounded-sm bg-muted/30" />
                  <div className="w-4 h-4 rounded-sm bg-chart-1/20" />
                  <div className="w-4 h-4 rounded-sm bg-chart-1/40" />
                  <div className="w-4 h-4 rounded-sm bg-chart-1/60" />
                  <div className="w-4 h-4 rounded-sm bg-chart-1/80" />
                  <div className="w-4 h-4 rounded-sm bg-chart-1" />
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
