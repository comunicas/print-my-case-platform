import { subDays, startOfMonth, endOfMonth, subMonths, startOfToday, endOfToday, startOfDay, endOfDay } from "date-fns";

export interface DateRange {
  from: Date;
  to: Date;
}

/**
 * Converts a period preference string to a DateRange object
 */
export function getDateRangeFromPeriod(period: string | null | undefined): DateRange {
  const today = new Date();
  
  switch (period) {
    case "today":
      return { from: startOfDay(today), to: endOfDay(today) };
    case "7days":
      return { from: startOfDay(subDays(today, 6)), to: endOfDay(today) };
    case "thisMonth":
      return { from: startOfMonth(today), to: endOfDay(today) };
    case "30days":
    default:
      return { from: startOfDay(subDays(today, 29)), to: endOfDay(today) };
  }
}

export const datePresets = [
  { 
    label: "Hoje", 
    getDates: () => ({ start: startOfToday(), end: endOfToday() }) 
  },
  { 
    label: "7 dias", 
    getDates: () => ({ start: subDays(new Date(), 7), end: new Date() }) 
  },
  { 
    label: "30 dias", 
    getDates: () => ({ start: subDays(new Date(), 30), end: new Date() }) 
  },
  { 
    label: "Este mês", 
    getDates: () => ({ start: startOfMonth(new Date()), end: new Date() }) 
  },
  { 
    label: "Mês passado", 
    getDates: () => ({ 
      start: startOfMonth(subMonths(new Date(), 1)), 
      end: endOfMonth(subMonths(new Date(), 1)) 
    }) 
  },
];
