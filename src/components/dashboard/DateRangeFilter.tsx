import { useState } from "react";
import { format, subDays, startOfDay, endOfDay, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DateRange } from "@/lib/utils/date-presets";

export type { DateRange } from "@/lib/utils/date-presets";

interface DateRangeFilterProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  dataRange?: { min: Date; max: Date };
  className?: string;
}

const PRESETS = [
  { label: "Hoje", days: 0 },
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

export function DateRangeFilter({
  dateRange,
  onDateRangeChange,
  dataRange,
  className,
}: DateRangeFilterProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const today = endOfDay(new Date());
  const daysDiff = differenceInDays(dateRange.to, dateRange.from) + 1;
  
  const handlePresetClick = (days: number) => {
    const to = today;
    const from = days === 0 ? startOfDay(today) : startOfDay(subDays(today, days - 1));
    onDateRangeChange({ from, to });
  };
  
  const handleViewAll = () => {
    if (dataRange) {
      onDateRangeChange({ from: dataRange.min, to: dataRange.max });
    }
  };
  
  const formatDateRange = () => {
    return `${format(dateRange.from, "dd/MM", { locale: ptBR })} - ${format(dateRange.to, "dd/MM", { locale: ptBR })}`;
  };
  
  const isPresetActive = (days: number) => {
    if (days === 0) {
      return differenceInDays(today, dateRange.from) === 0 && differenceInDays(today, dateRange.to) === 0;
    }
    return differenceInDays(today, dateRange.from) === days - 1 && differenceInDays(today, dateRange.to) === 0;
  };

  return (
    <div data-testid="date-filter" className={cn("flex flex-col sm:flex-row sm:items-center gap-3", className)}>
      {/* Preset Buttons */}
      <div className="flex items-center gap-1">
        {PRESETS.map((preset) => (
          <Button
            key={preset.days}
            data-testid={`date-preset-${preset.label.toLowerCase()}`}
            variant={isPresetActive(preset.days) ? "default" : "outline"}
            size="sm"
            onClick={() => handlePresetClick(preset.days)}
            className="h-8 px-3"
          >
            {preset.label}
          </Button>
        ))}
        
        {/* Custom Date Picker */}
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              data-testid="date-picker-trigger"
              variant="outline"
              size="sm"
              className={cn("h-8 px-3 gap-1", !PRESETS.some(p => isPresetActive(p.days)) && "border-primary")}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              <ChevronDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  onDateRangeChange({ from: startOfDay(range.from), to: endOfDay(range.to) });
                  setIsCalendarOpen(false);
                }
              }}
              disabled={(date) => {
                if (dataRange) {
                  return date < dataRange.min || date > dataRange.max;
                }
                return date > today;
              }}
              numberOfMonths={2}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Period Info */}
      <div data-testid="date-range-display" className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          {formatDateRange()}
        </span>
        <span>({daysDiff} {daysDiff === 1 ? 'dia' : 'dias'})</span>
        
        {dataRange && (
          <>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">
              Dados: {format(dataRange.min, "dd/MM", { locale: ptBR })} - {format(dataRange.max, "dd/MM", { locale: ptBR })}
            </span>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={handleViewAll}
            >
              Ver tudo
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
