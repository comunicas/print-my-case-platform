import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useSearchParams } from "react-router-dom";
import { datePresets } from "@/lib/utils/date-presets";

interface ReportFiltersContextType {
  startDate: Date | undefined;
  endDate: Date | undefined;
  selectedPdv: string;
  setStartDate: (date: Date | undefined) => void;
  setEndDate: (date: Date | undefined) => void;
  setSelectedPdv: (pdvId: string) => void;
  applyPreset: (preset: typeof datePresets[number]) => void;
  formatPeriod: () => string;
}

const ReportFiltersContext = createContext<ReportFiltersContextType | undefined>(undefined);

export function ReportFiltersProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize from URL or defaults
  const getInitialStartDate = () => {
    const param = searchParams.get("start");
    if (param) return new Date(param);
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  };

  const getInitialEndDate = () => {
    const param = searchParams.get("end");
    if (param) return new Date(param);
    return new Date();
  };

  const getInitialPdv = () => {
    return searchParams.get("pdv") || "all";
  };

  const [startDate, setStartDateState] = useState<Date | undefined>(getInitialStartDate);
  const [endDate, setEndDateState] = useState<Date | undefined>(getInitialEndDate);
  const [selectedPdv, setSelectedPdvState] = useState(getInitialPdv);

  const updateSearchParams = useCallback((updates: Record<string, string | undefined>) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          newParams.set(key, value);
        } else {
          newParams.delete(key);
        }
      });
      return newParams;
    });
  }, [setSearchParams]);

  const setStartDate = useCallback((date: Date | undefined) => {
    setStartDateState(date);
    updateSearchParams({ start: date?.toISOString().split("T")[0] });
  }, [updateSearchParams]);

  const setEndDate = useCallback((date: Date | undefined) => {
    setEndDateState(date);
    updateSearchParams({ end: date?.toISOString().split("T")[0] });
  }, [updateSearchParams]);

  const setSelectedPdv = useCallback((pdvId: string) => {
    setSelectedPdvState(pdvId);
    updateSearchParams({ pdv: pdvId === "all" ? undefined : pdvId });
  }, [updateSearchParams]);

  const applyPreset = useCallback((preset: typeof datePresets[number]) => {
    const { start, end } = preset.getDates();
    setStartDateState(start);
    setEndDateState(end);
    updateSearchParams({
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    });
  }, [updateSearchParams]);

  const formatPeriod = useCallback(() => {
    if (startDate && endDate) {
      return `${format(startDate, "dd/MM", { locale: ptBR })} - ${format(endDate, "dd/MM/yyyy", { locale: ptBR })}`;
    }
    return "";
  }, [startDate, endDate]);

  return (
    <ReportFiltersContext.Provider
      value={{
        startDate,
        endDate,
        selectedPdv,
        setStartDate,
        setEndDate,
        setSelectedPdv,
        applyPreset,
        formatPeriod,
      }}
    >
      {children}
    </ReportFiltersContext.Provider>
  );
}

export function useReportFilters() {
  const context = useContext(ReportFiltersContext);
  if (!context) {
    throw new Error("useReportFilters must be used within a ReportFiltersProvider");
  }
  return context;
}
