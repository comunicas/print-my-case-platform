import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

export interface MonthlySalesData {
  dailySales: {
    day: string;
    revenue: number;
    transactions: number;
  }[];
  weekdaySales: {
    day: string;
    revenue: number;
    transactions: number;
  }[];
  weeklySummary: {
    week: string;
    revenue: number;
    transactions: number;
    avgTicket: number;
  }[];
  totals: {
    totalRevenue: number;
    totalTransactions: number;
    avgTicket: number;
    variation: number;
    bestDay: { day: string; revenue: number };
    worstDay: { day: string; revenue: number };
  };
}

interface UseReportMonthlySalesParams {
  startDate: Date | undefined;
  endDate: Date | undefined;
  selectedPdv?: string;
}

export function useReportMonthlySales({ startDate, endDate, selectedPdv = "all" }: UseReportMonthlySalesParams) {
  const { profile } = useProfile();

  return useQuery({
    queryKey: ["report-monthly-sales", profile?.organization_id, startDate?.toISOString(), endDate?.toISOString(), selectedPdv],
    queryFn: async (): Promise<MonthlySalesData> => {
      if (!startDate || !endDate) {
        return {
          dailySales: [],
          weekdaySales: [],
          weeklySummary: [],
          totals: {
            totalRevenue: 0,
            totalTransactions: 0,
            avgTicket: 0,
            variation: 0,
            bestDay: { day: "-", revenue: 0 },
            worstDay: { day: "-", revenue: 0 },
          },
        };
      }

      // Build query
      let query = supabase
        .from("sales_records")
        .select("amount, refund_amount, payment_date, pdv_id")
        .gte("payment_date", startDate.toISOString())
        .lte("payment_date", endDate.toISOString());

      if (selectedPdv !== "all") {
        query = query.eq("pdv_id", selectedPdv);
      }

      const { data: salesData, error } = await query;

      if (error) throw error;

      // Group by day
      const dailyMap = new Map<string, { revenue: number; transactions: number }>();
      const weekdayMap = new Map<number, { revenue: number; transactions: number }>();
      const weekdayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

      salesData?.forEach(sale => {
        const date = new Date(sale.payment_date);
        const dayKey = date.getDate().toString();
        const weekday = date.getDay();
        const netAmount = Number(sale.amount) - Number(sale.refund_amount || 0);

        // Daily
        if (dailyMap.has(dayKey)) {
          const existing = dailyMap.get(dayKey)!;
          existing.revenue += netAmount;
          existing.transactions += 1;
        } else {
          dailyMap.set(dayKey, { revenue: netAmount, transactions: 1 });
        }

        // Weekday
        if (weekdayMap.has(weekday)) {
          const existing = weekdayMap.get(weekday)!;
          existing.revenue += netAmount;
          existing.transactions += 1;
        } else {
          weekdayMap.set(weekday, { revenue: netAmount, transactions: 1 });
        }
      });

      // Convert to arrays
      const dailySales = Array.from(dailyMap.entries())
        .map(([day, data]) => ({ day, ...data }))
        .sort((a, b) => parseInt(a.day) - parseInt(b.day));

      const weekdaySales = Array.from({ length: 7 }, (_, i) => ({
        day: weekdayNames[i],
        revenue: weekdayMap.get(i)?.revenue || 0,
        transactions: weekdayMap.get(i)?.transactions || 0,
      }));

      // Calculate weekly summary
      const weeklyMap = new Map<number, { revenue: number; transactions: number }>();
      salesData?.forEach(sale => {
        const date = new Date(sale.payment_date);
        const weekNum = Math.ceil(date.getDate() / 7);
        const netAmount = Number(sale.amount) - Number(sale.refund_amount || 0);

        if (weeklyMap.has(weekNum)) {
          const existing = weeklyMap.get(weekNum)!;
          existing.revenue += netAmount;
          existing.transactions += 1;
        } else {
          weeklyMap.set(weekNum, { revenue: netAmount, transactions: 1 });
        }
      });

      const weeklySummary = Array.from(weeklyMap.entries())
        .map(([weekNum, data]) => ({
          week: `Semana ${weekNum}`,
          revenue: data.revenue,
          transactions: data.transactions,
          avgTicket: data.transactions > 0 ? data.revenue / data.transactions : 0,
        }))
        .sort((a, b) => parseInt(a.week.split(" ")[1]) - parseInt(b.week.split(" ")[1]));

      // Calculate totals
      const totalRevenue = dailySales.reduce((acc, curr) => acc + curr.revenue, 0);
      const totalTransactions = dailySales.reduce((acc, curr) => acc + curr.transactions, 0);

      // Best/Worst day
      const bestDay = dailySales.length > 0
        ? dailySales.reduce((prev, curr) => (curr.revenue > prev.revenue ? curr : prev))
        : { day: "-", revenue: 0 };
      const worstDay = dailySales.length > 0
        ? dailySales.reduce((prev, curr) => (curr.revenue < prev.revenue ? curr : prev))
        : { day: "-", revenue: 0 };

      // Calculate variation vs previous period
      const periodLength = endDate.getTime() - startDate.getTime();
      const previousStart = new Date(startDate.getTime() - periodLength);
      const previousEnd = new Date(startDate.getTime() - 1);

      let previousQuery = supabase
        .from("sales_records")
        .select("amount, refund_amount")
        .gte("payment_date", previousStart.toISOString())
        .lte("payment_date", previousEnd.toISOString());

      if (selectedPdv !== "all") {
        previousQuery = previousQuery.eq("pdv_id", selectedPdv);
      }

      const { data: previousSalesData } = await previousQuery;

      const previousRevenue = previousSalesData?.reduce(
        (acc, sale) => acc + Number(sale.amount) - Number(sale.refund_amount || 0),
        0
      ) || 0;

      const variation = previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

      return {
        dailySales,
        weekdaySales,
        weeklySummary,
        totals: {
          totalRevenue,
          totalTransactions,
          avgTicket: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
          variation,
          bestDay: { day: bestDay.day, revenue: bestDay.revenue },
          worstDay: { day: worstDay.day, revenue: worstDay.revenue },
        },
      };
    },
    enabled: !!profile?.organization_id,
  });
}
