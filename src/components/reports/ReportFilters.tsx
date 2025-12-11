import { ReactNode } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { datePresets } from "@/lib/utils/date-presets";
import { useReportFilters } from "@/contexts/ReportFiltersContext";
import { usePDVs } from "@/hooks/usePDVs";

interface ReportFiltersProps {
  showPdvFilter?: boolean;
  showDateFilter?: boolean;
  showExportButton?: boolean;
  onExport?: () => void;
  extraActions?: ReactNode;
}

export function ReportFilters({
  showPdvFilter = true,
  showDateFilter = true,
  showExportButton = true,
  onExport,
  extraActions,
}: ReportFiltersProps) {
  const {
    startDate,
    endDate,
    selectedPdv,
    setStartDate,
    setEndDate,
    setSelectedPdv,
    applyPreset,
  } = useReportFilters();

  const { pdvs } = usePDVs();

  const pdvList = [
    { id: "all", name: "Todos os PDVs" },
    ...(pdvs?.map(p => ({ id: p.id, name: p.name })) || []),
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Date Presets */}
      {showDateFilter && (
        <div className="flex flex-wrap gap-2">
          {datePresets.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(preset)}
              className="text-xs"
            >
              {preset.label}
            </Button>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
        {/* PDV Filter */}
        {showPdvFilter && (
          <Select value={selectedPdv} onValueChange={setSelectedPdv}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Selecione o PDV" />
            </SelectTrigger>
            <SelectContent>
              {pdvList.map((pdv) => (
                <SelectItem key={pdv.id} value={pdv.id}>
                  {pdv.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Date Pickers */}
        {showDateFilter && (
          <>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-[180px] justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Data inicial"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    setStartDate(date);
                    if (date && endDate && date > endDate) {
                      setEndDate(date);
                    }
                  }}
                  initialFocus
                  className="pointer-events-auto"
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-[180px] justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Data final"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) => (startDate ? date < startDate : false)}
                  initialFocus
                  className="pointer-events-auto"
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </>
        )}

        {/* Extra Actions */}
        {extraActions}

        {/* Export Button */}
        {showExportButton && (
          <Button variant="outline" className="gap-2 sm:ml-auto" onClick={onExport}>
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        )}
      </div>
    </div>
  );
}
