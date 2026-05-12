import { useState } from "react";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, subDays, differenceInDays, getYear, getMonth, setMonth, setYear, isBefore, isAfter, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, ChevronDown, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
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
  onReset?: () => void;
  className?: string;
}

const PRESETS = [
  { label: "Hoje", getDates: () => { const t = new Date(); return { from: startOfDay(t), to: endOfDay(t) }; } },
  { label: "Ontem", getDates: () => { const t = subDays(new Date(), 1); return { from: startOfDay(t), to: endOfDay(t) }; } },
  { label: "Este mês", getDates: () => { const t = new Date(); return { from: startOfMonth(t), to: endOfDay(t) }; } },
  { label: "Mês anterior", getDates: () => { const t = new Date(); return { from: startOfMonth(subMonths(t, 1)), to: endOfMonth(subMonths(t, 1)) }; } },
];

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const YEARS = Array.from({ length: 8 }, (_, i) => 2020 + i);

function parseDateInput(value: string): Date | null {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  if (isNaN(d.getTime())) return null;
  return d;
}

function formatDateInput(date: Date): string {
  return format(date, "dd/MM/yyyy");
}

function applyDateMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").substring(0, 8);
  let result = digits;
  if (digits.length > 4) result = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
  else if (digits.length > 2) result = digits.slice(0, 2) + "/" + digits.slice(2);
  return result;
}

export function DateRangeFilter({
  dateRange,
  onDateRangeChange,
  dataRange,
  onReset,
  className,
}: DateRangeFilterProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [pendingFrom, setPendingFrom] = useState<Date | undefined>(undefined);
  const [currentMonth, setCurrentMonth] = useState<Date>(dateRange.from ?? new Date());
  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");

  const currentYear = getYear(new Date());
  const daysDiff = differenceInDays(dateRange.to, dateRange.from) + 1;

  const handlePresetClick = (getDates: () => { from: Date; to: Date }) => {
    const dates = getDates();
    onDateRangeChange(dates);
    setCurrentMonth(dates.from);
  };

  const handleTotalClick = () => {
    if (dataRange) {
      onDateRangeChange({ from: dataRange.min, to: dataRange.max });
    }
  };

  const isTotalActive = dataRange
    ? isSameDay(dateRange.from, dataRange.min) && isSameDay(dateRange.to, dataRange.max)
    : false;

  const needsYear = (date: Date) => getYear(date) !== currentYear;

  const formatDateDisplay = (date: Date) => {
    if (needsYear(date)) {
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    }
    return format(date, "dd/MM", { locale: ptBR });
  };

  const formatDateRange = () => {
    return `${formatDateDisplay(dateRange.from)} - ${formatDateDisplay(dateRange.to)}`;
  };

  const isPresetActive = (getDates: () => { from: Date; to: Date }) => {
    const { from, to } = getDates();
    return (
      Math.abs(differenceInDays(dateRange.from, from)) === 0 &&
      Math.abs(differenceInDays(dateRange.to, to)) === 0
    );
  };

  // Two-click day selection logic — bypasses react-day-picker range quirks
  const handleDayClick = (day: Date) => {
    if (!pendingFrom) {
      // First click: store start date
      setPendingFrom(day);
      setFromInput(formatDateInput(day));
      setToInput("");
    } else {
      // Second click: compute range and close
      const from = isBefore(day, pendingFrom) ? day : pendingFrom;
      const to = isAfter(day, pendingFrom) ? day : pendingFrom;
      onDateRangeChange({ from: startOfDay(from), to: endOfDay(to) });
      setPendingFrom(undefined);
      setFromInput("");
      setToInput("");
      setIsCalendarOpen(false);
    }
  };

  const handleInputChange = (field: "from" | "to", value: string) => {
    const masked = applyDateMask(value);
    if (field === "from") setFromInput(masked);
    else setToInput(masked);

    if (masked.length === 10) {
      const parsed = parseDateInput(masked);
      if (parsed) {
        if (field === "from") {
          const toDate = parseDateInput(toInput);
          if (toDate && toDate >= parsed) {
            onDateRangeChange({ from: startOfDay(parsed), to: endOfDay(toDate) });
            setPendingFrom(undefined);
            setIsCalendarOpen(false);
          }
        } else {
          const fromDate = parseDateInput(fromInput);
          if (fromDate && parsed >= fromDate) {
            onDateRangeChange({ from: startOfDay(fromDate), to: endOfDay(parsed) });
            setPendingFrom(undefined);
            setIsCalendarOpen(false);
          }
        }
      }
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsCalendarOpen(open);
    if (open) {
      setFromInput(formatDateInput(dateRange.from));
      setToInput(formatDateInput(dateRange.to));
      setPendingFrom(undefined);
      setCurrentMonth(dateRange.from);
    } else {
      setPendingFrom(undefined);
      setFromInput("");
      setToInput("");
    }
  };

  // Build modifiers for the calendar based on current state
  const calendarModifiers = pendingFrom
    ? { pendingStart: pendingFrom }
    : { rangeStart: dateRange.from, rangeEnd: dateRange.to };

  const calendarModifiersStyles = pendingFrom
    ? {
        pendingStart: {
          backgroundColor: "hsl(var(--primary))",
          color: "hsl(var(--primary-foreground))",
          borderRadius: "50%",
        },
      }
    : {};

  // When pending, show single selection; otherwise show the active range
  const calendarSelected = pendingFrom
    ? undefined // Don't pass range so DayPicker doesn't render range highlight
    : { from: dateRange.from, to: dateRange.to };

  const isAnyPresetActive = PRESETS.some(p => isPresetActive(p.getDates)) || isTotalActive;

  return (
    <div data-testid="date-filter" className={cn("flex flex-col sm:flex-row sm:items-center gap-3", className)}>
      {/* Preset Buttons */}
      <div className="flex items-center gap-1 flex-nowrap overflow-x-auto scrollbar-hide">
        {PRESETS.map((preset) => (
          <Button
            key={preset.label}
            data-testid={`date-preset-${preset.label.toLowerCase().replace(/\s+/g, "-")}`}
            variant={isPresetActive(preset.getDates) ? "default" : "outline"}
            size="sm"
            onClick={() => handlePresetClick(preset.getDates)}
            className="h-10 sm:h-8 px-4 sm:px-3 touch-manipulation"
          >
            {preset.label}
          </Button>
        ))}

        {/* Total preset — depends on dataRange */}
        <Button
          data-testid="date-preset-total"
          variant={isTotalActive ? "default" : "outline"}
          size="sm"
          onClick={handleTotalClick}
          disabled={!dataRange}
          className="h-10 sm:h-8 px-4 sm:px-3 touch-manipulation"
        >
          Total
        </Button>

        {/* Custom Date Picker */}
        <Popover open={isCalendarOpen} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button
              data-testid="date-picker-trigger"
              variant="outline"
              size="sm"
              className={cn(
                "h-10 sm:h-8 px-4 sm:px-3 gap-1 touch-manipulation",
                !isAnyPresetActive && "border-primary"
              )}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              <ChevronDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            {/* Manual date inputs */}
            <div className="flex items-center gap-2 p-3 border-b border-border">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">De</span>
                <Input
                  value={fromInput}
                  onChange={(e) => handleInputChange("from", e.target.value)}
                  placeholder="DD/MM/AAAA"
                  className="h-8 w-32 text-sm font-mono"
                  maxLength={10}
                />
              </div>
              <span className="text-muted-foreground mt-5">→</span>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Até</span>
                <Input
                  value={toInput}
                  onChange={(e) => handleInputChange("to", e.target.value)}
                  placeholder="DD/MM/AAAA"
                  className="h-8 w-32 text-sm font-mono"
                  maxLength={10}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 mt-5 shrink-0"
                onClick={() => setIsCalendarOpen(false)}
                title="Fechar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Month + Year navigation */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30">
              <span className="text-xs text-muted-foreground shrink-0">Navegar:</span>
              <select
                value={getMonth(currentMonth)}
                onChange={(e) => setCurrentMonth(setMonth(currentMonth, Number(e.target.value)))}
                className="text-sm border border-border rounded px-2 py-1 bg-popover text-popover-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {MONTHS_PT.map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
              <select
                value={getYear(currentMonth)}
                onChange={(e) => setCurrentMonth(setYear(currentMonth, Number(e.target.value)))}
                className="text-sm border border-border rounded px-2 py-1 bg-popover text-popover-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Pending selection hint */}
            {pendingFrom && (
              <div className="px-3 py-1.5 text-xs text-muted-foreground bg-muted/50 border-b border-border">
                Selecione a data final no calendário
              </div>
            )}

            <Calendar
              mode="range"
              selected={calendarSelected}
              onDayClick={handleDayClick}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              modifiers={calendarModifiers}
              modifiersStyles={calendarModifiersStyles}
              disabled={(date) => {
                if (dataRange) {
                  return date < dataRange.min || date > dataRange.max;
                }
                return date > endOfDay(new Date());
              }}
              numberOfMonths={2}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Period Info */}
      <div data-testid="date-range-display" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          {formatDateRange()}
        </span>
        <span>({daysDiff} {daysDiff === 1 ? 'dia' : 'dias'})</span>

        {dataRange && (
          <>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">
              Dados: {formatDateDisplay(dataRange.min)} - {formatDateDisplay(dataRange.max)}
            </span>
          </>
        )}

        {onReset && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            onClick={onReset}
            title="Restaurar período padrão"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
