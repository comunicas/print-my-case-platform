import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

export interface SalesUnitData {
  salesByPdv: {
    pdv: string;
    pdvId: string;
    revenue: number;
    transactions: number;
    avgTicket: number;
    variation: number;
  }[];
  evolutionData: {
    month: string;
    [pdvName: string]: number | string;
  }[];
  totals: {
    revenue: number;
    transactions: number;
    avgTicket: number;
    activePdvs: number;
  };
}

interface UseReportSalesUnitParams {
  startDate: Date | undefined;
  endDate: Date | undefined;
  selectedPdv: string;
}

export function useReportSalesUnit({ startDate, endDate, selectedPdv }: UseReportSalesUnitParams) {
  const { profile } = useProfile();

  return useQuery({
    queryKey: ["report-sales-unit", profile?.organization_id, startDate?.toISOString(), endDate?.toISOString(), selectedPdv],
    queryFn: async (): Promise<SalesUnitData> => {
      if (!startDate || !endDate) {
        return { salesByPdv: [], evolutionData: [], totals: { revenue: 0, transactions: 0, avgTicket: 0, activePdvs: 0 } };
      }

      // Fetch sales records with PDV info for current period
      const { data: salesData, error: salesError } = await supabase
        .from("sales_records")
        .select(`
          id,
          amount,
          refund_amount,
          payment_date,
          pdv_id,
          pdv:pdvs!inner(id, name)
        `)
        .gte("payment_date", startDate.toISOString())
        .lte("payment_date", endDate.toISOString());

      if (salesError) throw salesError;

      // Filter by selected PDV if not "all"
      const filteredSales = selectedPdv === "all" 
        ? salesData 
        : salesData?.filter(s => s.pdv_id === selectedPdv);

      // Group by PDV
      const pdvMap = new Map<string, { pdvId: string; pdv: string; revenue: number; transactions: number }>();
      
      filteredSales?.forEach(sale => {
        const pdvId = sale.pdv_id;
        const pdvName = (sale.pdv as { id: string; name: string })?.name || "Desconhecido";
        const netAmount = Number(sale.amount) - Number(sale.refund_amount || 0);
        
        if (pdvMap.has(pdvId)) {
          const existing = pdvMap.get(pdvId)!;
          existing.revenue += netAmount;
          existing.transactions += 1;
        } else {
          pdvMap.set(pdvId, {
            pdvId,
            pdv: pdvName,
            revenue: netAmount,
            transactions: 1,
          });
        }
      });

      // Calculate previous period for variation
      const periodLength = endDate.getTime() - startDate.getTime();
      const previousStart = new Date(startDate.getTime() - periodLength);
      const previousEnd = new Date(startDate.getTime() - 1);

      const { data: previousSalesData } = await supabase
        .from("sales_records")
        .select("pdv_id, amount, refund_amount")
        .gte("payment_date", previousStart.toISOString())
        .lte("payment_date", previousEnd.toISOString());

      const previousPdvMap = new Map<string, number>();
      previousSalesData?.forEach(sale => {
        const pdvId = sale.pdv_id;
        const netAmount = Number(sale.amount) - Number(sale.refund_amount || 0);
        previousPdvMap.set(pdvId, (previousPdvMap.get(pdvId) || 0) + netAmount);
      });

      // Build salesByPdv with variation
      const salesByPdv = Array.from(pdvMap.values()).map(item => {
        const previousRevenue = previousPdvMap.get(item.pdvId) || 0;
        const variation = previousRevenue > 0 
          ? ((item.revenue - previousRevenue) / previousRevenue) * 100 
          : 0;
        
        return {
          ...item,
          avgTicket: item.transactions > 0 ? item.revenue / item.transactions : 0,
          variation: Math.round(variation),
        };
      }).sort((a, b) => b.revenue - a.revenue);

      // Fetch evolution data (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: evolutionSales } = await supabase
        .from("sales_records")
        .select("amount, refund_amount, payment_date, pdv:pdvs!inner(name)")
        .gte("payment_date", sixMonthsAgo.toISOString());

      // Group by month and PDV
      const monthPdvMap = new Map<string, Map<string, number>>();
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

      evolutionSales?.forEach(sale => {
        const date = new Date(sale.payment_date);
        const monthKey = months[date.getMonth()];
        const pdvName = (sale.pdv as { name: string })?.name || "Desconhecido";
        const netAmount = Number(sale.amount) - Number(sale.refund_amount || 0);

        if (!monthPdvMap.has(monthKey)) {
          monthPdvMap.set(monthKey, new Map());
        }
        const pdvMonthMap = monthPdvMap.get(monthKey)!;
        pdvMonthMap.set(pdvName, (pdvMonthMap.get(pdvName) || 0) + netAmount);
      });

      // Convert to evolution data format
      const evolutionData: SalesUnitData["evolutionData"] = [];
      monthPdvMap.forEach((pdvValues, month) => {
        const entry: SalesUnitData["evolutionData"][0] = { month };
        pdvValues.forEach((value, pdvName) => {
          entry[pdvName] = value;
        });
        evolutionData.push(entry);
      });

      // Calculate totals
      const totals = {
        revenue: salesByPdv.reduce((acc, curr) => acc + curr.revenue, 0),
        transactions: salesByPdv.reduce((acc, curr) => acc + curr.transactions, 0),
        avgTicket: 0,
        activePdvs: salesByPdv.length,
      };
      totals.avgTicket = totals.transactions > 0 ? totals.revenue / totals.transactions : 0;

      return { salesByPdv, evolutionData, totals };
    },
    enabled: !!profile?.organization_id,
  });
}
