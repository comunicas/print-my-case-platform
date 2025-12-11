import { subDays, startOfMonth, endOfMonth, subMonths, startOfToday, endOfToday } from "date-fns";

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
