import { Clock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface QuickStatsProps {
  peakTimeRange: string | null;
  peakTimeRangeRevenue: number | null;
  bestDay: string | null;
  bestDayRevenue: number | null;
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export function QuickStats({ peakTimeRange, peakTimeRangeRevenue, bestDay, bestDayRevenue }: QuickStatsProps) {
  if (!peakTimeRange && !bestDay) return null;
  
  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-2">
        {peakTimeRange && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 cursor-help">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-xs">Pico: {peakTimeRange}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Receita: {peakTimeRangeRevenue ? formatCurrency(peakTimeRangeRevenue) : 'N/A'}</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {bestDay && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 cursor-help">
                <Calendar className="h-3.5 w-3.5" />
                <span className="text-xs">Melhor: {bestDay}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Receita: {bestDayRevenue ? formatCurrency(bestDayRevenue) : 'N/A'}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
