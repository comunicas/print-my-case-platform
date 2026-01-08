import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface StockHistoryData {
  date: string;
  dateDisplay: string;
  [brand: string]: string | number;
}

interface UseStockHistoryOptions {
  days?: number;
  organizationId?: string;
  pdvId?: string;
}

export function useStockHistory({ days = 90, organizationId, pdvId }: UseStockHistoryOptions = {}) {
  return useQuery({
    queryKey: ["stock-history", days, organizationId, pdvId],
    queryFn: async () => {
      const startDate = subDays(new Date(), days).toISOString().split('T')[0];
      
      let query = supabase
        .from("stock_history")
        .select("snapshot_date, brand, total_quantity")
        .gte("snapshot_date", startDate)
        .order("snapshot_date", { ascending: true });
      
      if (organizationId && organizationId !== "all") {
        query = query.eq("organization_id", organizationId);
      }
      
      if (pdvId && pdvId !== "all") {
        query = query.eq("pdv_id", pdvId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return { chartData: [], brands: [] };
      }
      
      // Group by date and sum by brand
      const byDate = new Map<string, Record<string, number>>();
      const brandsSet = new Set<string>();
      
      for (const record of data) {
        brandsSet.add(record.brand);
        
        if (!byDate.has(record.snapshot_date)) {
          byDate.set(record.snapshot_date, {});
        }
        const dateEntry = byDate.get(record.snapshot_date)!;
        dateEntry[record.brand] = (dateEntry[record.brand] || 0) + record.total_quantity;
      }
      
      // Convert to chart format
      const chartData: StockHistoryData[] = [];
      const sortedDates = Array.from(byDate.keys()).sort();
      
      for (const date of sortedDates) {
        const entry: StockHistoryData = {
          date,
          dateDisplay: format(new Date(date + 'T00:00:00'), "EEE, dd MMM", { locale: ptBR }),
        };
        
        const brandData = byDate.get(date)!;
        for (const brand of brandsSet) {
          entry[brand] = brandData[brand] || 0;
        }
        
        chartData.push(entry);
      }
      
      // Sort brands by relevance
      const brandOrder = ["APPLE", "SAMSUNG", "XIAOMI", "MOTOROLA", "REALME", "OUTROS"];
      const brands = Array.from(brandsSet).sort((a, b) => {
        const indexA = brandOrder.indexOf(a);
        const indexB = brandOrder.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
      
      return { chartData, brands };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
