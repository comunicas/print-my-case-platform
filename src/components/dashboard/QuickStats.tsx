import { Clock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface QuickStatsProps {
  peakHour: string | null;
  bestDay: string | null;
}

export function QuickStats({ peakHour, bestDay }: QuickStatsProps) {
  if (!peakHour && !bestDay) return null;
  
  return (
    <div className="flex flex-wrap items-center gap-2">
      {peakHour && (
        <Badge variant="secondary" className="gap-1.5 py-1 px-2.5">
          <Clock className="h-3.5 w-3.5" />
          <span className="text-xs">Pico: {peakHour}</span>
        </Badge>
      )}
      
      {bestDay && (
        <Badge variant="secondary" className="gap-1.5 py-1 px-2.5">
          <Calendar className="h-3.5 w-3.5" />
          <span className="text-xs">Melhor: {bestDay}</span>
        </Badge>
      )}
    </div>
  );
}
