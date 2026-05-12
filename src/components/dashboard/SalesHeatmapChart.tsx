import { useMemo } from "react";
import { Grid3x3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, pluralize, formatCurrency } from "@/lib/utils";
import { HeatmapCell, TIME_RANGES, getHeatmapPeak } from "@/lib/dashboardUtils";
import { ChartCard } from "./ChartCard";

interface SalesHeatmapChartProps {
  data: HeatmapCell[];
  animationDelay?: number;
}

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function SalesHeatmapChart({ data, animationDelay = 0 }: SalesHeatmapChartProps) {
  const { grid, maxRevenue, peak } = useMemo(() => {
    const max = Math.max(...data.map(d => d.revenue), 1);
    const peakData = getHeatmapPeak(data);
    
    const gridData: (HeatmapCell | undefined)[][] = [];
    for (let r = 0; r < TIME_RANGES.length; r++) {
      gridData[r] = [];
      for (let d = 0; d < 7; d++) {
        gridData[r][d] = data.find(cell => cell.rangeId === r && cell.dayOfWeek === d);
      }
    }
    
    return { grid: gridData, maxRevenue: max, peak: peakData };
  }, [data]);
  
  const getCellColor = (revenue: number) => {
    if (revenue === 0 || maxRevenue === 0) return "bg-muted/40";
    const ratio = revenue / maxRevenue;
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
    const exportData: Record<string, string | number>[] = TIME_RANGES.map(range => {
      const row: Record<string, string | number> = { Horário: range.label };
      DAYS.forEach((day, idx) => {
        const cell = data.find(c => c.rangeId === range.id && c.dayOfWeek === idx);
        row[day] = cell?.revenue || 0;
      });
      return row;
    });
    exportToExcel(exportData, "heatmap-vendas");
  };

  return (
    <ChartCard
      testId="sales-heatmap-chart"
      title="Vendas por Horário"
      description="Concentração de vendas por dia e horário"
      icon={Grid3x3}
      iconColor="text-purple-500"
      headerBadge={peak && (
        <Badge data-testid="heatmap-peak-badge" variant="outline" className="gap-1 text-xs">
          Pico: {peak.dayName} {peak.rangeLabel}
        </Badge>
      )}
      animationDelay={animationDelay}
    >
      {data.length > 0 ? (
        <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
          <div
            data-testid="heatmap-grid"
            className="w-full min-w-[340px]"
            role="grid"
            aria-label="Mapa de calor de vendas por dia e horário"
          >
            <div className="grid grid-cols-8 gap-1 mb-1">
              <div className="text-xs text-muted-foreground text-right pr-1"></div>
              {DAYS.map(day => (
                <div key={day} className="text-xs text-muted-foreground text-center font-medium">
                  {day}
                </div>
              ))}
            </div>
            
            <TooltipProvider>
              {TIME_RANGES.map((range, rIdx) => (
                <div key={range.id} className="grid grid-cols-8 gap-1 mb-1 relative">
                  <div className="text-[10px] md:text-xs text-muted-foreground text-right pr-1 leading-6 md:leading-8">
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
                              "h-6 md:h-8 rounded cursor-default",
                              "transition-all duration-200 ease-out",
                              "hover:scale-110 hover:shadow-lg hover:z-10",
                              "hover:ring-2 hover:ring-foreground/20",
                              getCellColor(revenue),
                              isPeakCell(rIdx, dIdx) && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                            )}
                            role="gridcell"
                            aria-label={`${day} ${range.label}: ${pluralize(count, 'venda', 'vendas')}, ${formatCurrency(revenue)}${isPeakCell(rIdx, dIdx) ? ' - Horário de pico' : ''}`}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-sm">{day} {range.label}</span>
                            <span className="text-xs">Receita: {formatCurrency(revenue)}</span>
                            <span className="text-xs text-muted-foreground">{pluralize(count, 'venda', 'vendas')}</span>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </TooltipProvider>
            
            <div 
              className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground"
              role="legend"
              aria-label="Legenda: cores indicam intensidade de vendas, de menos (claro) a mais (escuro)"
            >
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
        <div data-testid="heatmap-empty" className="flex-1 min-h-[150px] flex items-center justify-center text-muted-foreground">
          Nenhum dado disponível
        </div>
      )}
    </ChartCard>
  );
}
