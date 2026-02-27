import { subDays, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from "date-fns";

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
    case "yesterday":
      return { from: startOfDay(subDays(today, 1)), to: endOfDay(subDays(today, 1)) };
    case "thisMonth":
      return { from: startOfMonth(today), to: endOfDay(today) };
    case "lastMonth":
      return {
        from: startOfMonth(subMonths(today, 1)),
        to: endOfMonth(subMonths(today, 1)),
      };
    case "7days":
      return { from: startOfDay(subDays(today, 6)), to: endOfDay(today) };
    case "30days":
    default:
      return { from: startOfDay(subDays(today, 29)), to: endOfDay(today) };
  }
}

export const datePresets = [
  { 
    label: "Hoje", 
    getDates: () => ({ start: startOfDay(new Date()), end: endOfDay(new Date()) }) 
  },
  { 
    label: "Ontem", 
    getDates: () => ({ start: startOfDay(subDays(new Date(), 1)), end: endOfDay(subDays(new Date(), 1)) }) 
  },
  { 
    label: "Este mês", 
    getDates: () => ({ start: startOfMonth(new Date()), end: endOfDay(new Date()) }) 
  },
  { 
    label: "Mês anterior", 
    getDates: () => ({ 
      start: startOfMonth(subMonths(new Date(), 1)), 
      end: endOfMonth(subMonths(new Date(), 1)) 
    }) 
  },
];
