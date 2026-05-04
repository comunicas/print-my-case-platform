import { useQuery } from "@tanstack/react-query";
import { startOfDay, endOfDay, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { useUserAllowedPDVs } from "./useUserAllowedPDVs";
import {
  SalesByDayData,
  HeatmapCell,
  TopProductData,
  QuickStatsData,
  LossesByDayData,
  TIME_RANGES,
} from "@/lib/dashboardUtils";
import { extractBrandFromProductName } from "@/lib/productNormalization";

export interface DashboardData {
  kpis: {
    // Current period values
    totalRevenue: number;
    grossRevenue: number;
    totalRefunds: number;
    refundedTransactions: number;
    transactions: number;
    avgTicket: number;
    activePdvs: number;
    // Cancellations (pre-payment)
    totalCancellations: number;
    cancelledTransactions: number;
    previousCancellationsTotal: number;
    // Previous period values (for trend calculation via calculateTrend)
    previousRevenue: number;
    previousTransactions: number;
    previousAvgTicket: number;
    previousRefunds: number;
  };
  hasData: boolean;
  globalMetrics?: {
    totalOrganizations: number;
    totalPdvsGlobal: number;
    totalRevenueGlobal: number;
    totalTransactionsGlobal: number;
    totalRefundsGlobal: number;
    avgTicketGlobal: number;
  };
  // Chart data
  salesByDay: SalesByDayData[];
  salesByHourAndDay: HeatmapCell[];
  topProductsChart: TopProductData[];
  quickStats: QuickStatsData;
  lossesByDay: LossesByDayData[];
  chartDataTruncated: boolean;
}

interface UseDashboardParams {
  selectedOrganizationId?: string | "all";
  selectedPdvId?: string | "all";
  dateRange?: { from: Date; to: Date };
}

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function getTimeRangeIdForHour(hour: number): number | null {
  const r = TIME_RANGES.find((rng) => hour >= rng.start && hour < rng.start + 2);
  return r ? r.id : null;
}

export function useDashboard({ selectedOrganizationId, selectedPdvId, dateRange }: UseDashboardParams = {}) {
  const { profile, role } = useProfile();
  const { allowedPdvIds: userAllowedPdvIds } = useUserAllowedPDVs();
  const isSuperAdmin = role === "super_admin";

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", profile?.organization_id, selectedOrganizationId, selectedPdvId, isSuperAdmin, userAllowedPdvIds, dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    queryFn: async (): Promise<DashboardData> => {
      const now = new Date();
      // Use dateRange if provided, otherwise default to 30 days
      // Apply startOfDay/endOfDay for precise boundaries
      const startDate = startOfDay(dateRange?.from || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
      const endDate = endOfDay(dateRange?.to || now);
      
      // Calculate previous period for comparison
      const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
      const previousStartDate = startOfDay(new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000));
      const previousEndDate = endOfDay(new Date(startDate.getTime() - 1));

      // Determine which PDVs to query based on role and filters
      let pdvIds: string[] | null = null;
      
      // If a specific PDV is selected, use it directly
      if (selectedPdvId && selectedPdvId !== "all") {
        pdvIds = [selectedPdvId];
      } else if (userAllowedPdvIds !== null) {
        // Usuário com restrições específicas de PDV
        pdvIds = userAllowedPdvIds;
      } else if (!isSuperAdmin || (selectedOrganizationId && selectedOrganizationId !== "all")) {
        // Usar todos os PDVs da organização
        const orgIdToFilter = selectedOrganizationId && selectedOrganizationId !== "all" 
          ? selectedOrganizationId 
          : profile?.organization_id;
        
        if (orgIdToFilter) {
          const { data: pdvs } = await supabase
            .from("pdvs")
            .select("id")
            .eq("organization_id", orgIdToFilter);
          pdvIds = pdvs?.map(p => p.id) || [];
        }
      }

      // KPIs reais (sem cap de 1000 linhas) — RPC consolidada
      const kpisRpc = supabase.rpc("get_dashboard_kpis", {
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString(),
        p_prev_start: previousStartDate.toISOString(),
        p_prev_end: previousEndDate.toISOString(),
        p_pdv_ids: pdvIds,
      });

      // Charts agregados no backend (sem cap de 1000 linhas, sem limit no client)
      const chartsRpc = supabase.rpc("get_dashboard_charts", {
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString(),
        p_pdv_ids: pdvIds,
      });

      let activePdvsQuery = supabase
        .from("pdvs")
        .select("id")
        .eq("status", "active");

      // Apply organization filter for PDVs count
      if (!isSuperAdmin || (selectedOrganizationId && selectedOrganizationId !== "all")) {
        const orgIdToFilter = selectedOrganizationId && selectedOrganizationId !== "all" 
          ? selectedOrganizationId 
          : profile?.organization_id;
        if (orgIdToFilter) {
          activePdvsQuery = activePdvsQuery.eq("organization_id", orgIdToFilter);
        }
      }

      // Fetch all data in parallel
      const [
        kpisResult,
        chartsResult,
        activePdvsResult,
      ] = await Promise.all([
        kpisRpc,
        chartsRpc,
        activePdvsQuery,
      ]);

      // Fetch global metrics for super_admin via SECURITY DEFINER RPC
      // (avoids HEAD COUNT timeouts caused by per-row RLS evaluation)
      let globalMetrics: DashboardData["globalMetrics"] = undefined;
      if (isSuperAdmin) {
        const { data: globalRows, error: globalErr } = await supabase.rpc(
          "get_super_admin_global_metrics",
          {
            p_start_date: startDate.toISOString(),
            p_end_date: endDate.toISOString(),
          }
        );
        if (!globalErr && globalRows && globalRows.length > 0) {
          const row = globalRows[0];
          globalMetrics = {
            totalOrganizations: Number(row.total_organizations) || 0,
            totalPdvsGlobal: Number(row.total_pdvs_global) || 0,
            totalRevenueGlobal: Number(row.total_revenue_global) || 0,
            totalTransactionsGlobal: Number(row.total_transactions_global) || 0,
            totalRefundsGlobal: Number(row.total_refunds_global) || 0,
            avgTicketGlobal: Number(row.avg_ticket_global) || 0,
          };
        }
      }

      // KPIs vindos da RPC (totais reais do período, sem cap de 1000 linhas)
      const kpiRow = (kpisResult.data?.[0] ?? null) as {
        gross_revenue: number | string;
        total_refunds: number | string;
        refunded_transactions: number | string;
        transactions: number | string;
        card_revenue: number | string;
        total_cancellations: number | string;
        cancelled_transactions: number | string;
        prev_gross_revenue: number | string;
        prev_total_refunds: number | string;
        prev_transactions: number | string;
        prev_total_cancellations: number | string;
      } | null;

      const grossRevenue = Number(kpiRow?.gross_revenue ?? 0);
      const totalRefunds = Number(kpiRow?.total_refunds ?? 0);
      const refundedTransactions = Number(kpiRow?.refunded_transactions ?? 0);
      const transactions = Number(kpiRow?.transactions ?? 0);
      const totalRevenue = grossRevenue - totalRefunds;
      const avgTicket = transactions > 0 ? totalRevenue / transactions : 0;

      const previousRevenue = Number(kpiRow?.prev_gross_revenue ?? 0) - Number(kpiRow?.prev_total_refunds ?? 0);
      const previousTransactions = Number(kpiRow?.prev_transactions ?? 0);
      const previousAvgTicket = previousTransactions > 0 ? previousRevenue / previousTransactions : 0;
      const previousRefunds = Number(kpiRow?.prev_total_refunds ?? 0);

      const totalCancellations = Number(kpiRow?.total_cancellations ?? 0);
      const cancelledTransactions = Number(kpiRow?.cancelled_transactions ?? 0);
      const previousCancellationsTotal = Number(kpiRow?.prev_total_cancellations ?? 0);

      const kpis = {
        totalRevenue,
        grossRevenue,
        totalRefunds,
        refundedTransactions,
        transactions,
        avgTicket,
        previousRevenue,
        previousTransactions,
        previousAvgTicket,
      };

      const activePdvs = activePdvsResult.data?.length || 0;
      const hasData = transactions > 0;

      // Dados dos gráficos vêm 100% agregados pelo backend (sem cap de 1000 / sem limit)
      const chartsPayload = (chartsResult.data ?? {}) as {
        sales_by_day?: { day: string; revenue: number | string; count: number | string }[];
        sales_by_hour_day?: { hour: number; day_of_week: number; revenue: number | string; count: number | string }[];
        top_products?: { name: string; revenue: number | string; count: number | string }[];
        losses_by_day?: { day: string; cancellations: number | string; cancellation_count: number | string; refunds: number | string; refund_count: number | string }[];
      };

      // === Sales by day (preenche dias vazios) ===
      const byDay = new Map<string, { revenue: number; count: number }>();
      for (const r of chartsPayload.sales_by_day ?? []) {
        byDay.set(String(r.day), { revenue: Number(r.revenue), count: Number(r.count) });
      }
      const cur = new Date(startDate); cur.setHours(0, 0, 0, 0);
      const endD = new Date(endDate); endD.setHours(23, 59, 59, 999);
      while (cur <= endD) {
        const k = format(cur, "yyyy-MM-dd");
        if (!byDay.has(k)) byDay.set(k, { revenue: 0, count: 0 });
        cur.setDate(cur.getDate() + 1);
      }
      const salesByDay: SalesByDayData[] = Array.from(byDay.entries())
        .map(([date, d]) => ({
          date,
          dateDisplay: format(parseISO(date), "EEE, dd/MM", { locale: ptBR }),
          revenue: d.revenue,
          count: d.count,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // === Heatmap por faixa horária x dia ===
      const heatMap = new Map<string, { revenue: number; count: number }>();
      for (const range of TIME_RANGES) {
        for (let day = 0; day < 7; day++) {
          heatMap.set(`${range.id}-${day}`, { revenue: 0, count: 0 });
        }
      }
      for (const r of chartsPayload.sales_by_hour_day ?? []) {
        const rid = getTimeRangeIdForHour(Number(r.hour));
        if (rid === null) continue;
        const key = `${rid}-${Number(r.day_of_week)}`;
        const cell = heatMap.get(key)!;
        cell.revenue += Number(r.revenue);
        cell.count += Number(r.count);
      }
      const salesByHourAndDay: HeatmapCell[] = [];
      for (const range of TIME_RANGES) {
        for (let day = 0; day < 7; day++) {
          const cell = heatMap.get(`${range.id}-${day}`)!;
          salesByHourAndDay.push({
            rangeId: range.id,
            rangeLabel: range.label,
            dayOfWeek: day,
            dayName: DAY_NAMES[day],
            revenue: cell.revenue,
            count: cell.count,
          });
        }
      }

      // === Top produtos (backend devolve top 20, cortamos em 10 com brand) ===
      const topProductsChart: TopProductData[] = (chartsPayload.top_products ?? [])
        .slice(0, 10)
        .map((p) => ({
          name: p.name,
          revenue: Number(p.revenue),
          count: Number(p.count),
          brand: extractBrandFromProductName(p.name),
        }));

      // === Quick stats (derivados do heatmap e das vendas por dia) ===
      const rangeRevenue = new Map<number, { label: string; revenue: number }>();
      for (const range of TIME_RANGES) rangeRevenue.set(range.id, { label: range.label, revenue: 0 });
      for (const cell of salesByHourAndDay) {
        const acc = rangeRevenue.get(cell.rangeId)!;
        acc.revenue += cell.revenue;
      }
      let peakTimeRange: string | null = null;
      let peakTimeRangeRevenue = 0;
      for (const v of rangeRevenue.values()) {
        if (v.revenue > peakTimeRangeRevenue) { peakTimeRangeRevenue = v.revenue; peakTimeRange = v.label; }
      }
      const dayRevenue = new Map<number, number>();
      for (const cell of salesByHourAndDay) {
        dayRevenue.set(cell.dayOfWeek, (dayRevenue.get(cell.dayOfWeek) || 0) + cell.revenue);
      }
      let bestDayIdx: number | null = null;
      let bestDayRevenue = 0;
      for (const [d, r] of dayRevenue.entries()) {
        if (r > bestDayRevenue) { bestDayRevenue = r; bestDayIdx = d; }
      }
      const quickStats: QuickStatsData = {
        peakTimeRange,
        peakTimeRangeRevenue: peakTimeRangeRevenue > 0 ? peakTimeRangeRevenue : null,
        bestDay: bestDayIdx !== null ? DAY_NAMES[bestDayIdx] : null,
        bestDayRevenue: bestDayRevenue > 0 ? bestDayRevenue : null,
      };

      // === Losses by day (preenche dias vazios) ===
      const lossMap = new Map<string, { cancellations: number; cancellationCount: number; refunds: number; refundCount: number }>();
      for (const r of chartsPayload.losses_by_day ?? []) {
        lossMap.set(String(r.day), {
          cancellations: Number(r.cancellations),
          cancellationCount: Number(r.cancellation_count),
          refunds: Number(r.refunds),
          refundCount: Number(r.refund_count),
        });
      }
      const cur2 = new Date(startDate); cur2.setHours(0, 0, 0, 0);
      while (cur2 <= endD) {
        const k = format(cur2, "yyyy-MM-dd");
        if (!lossMap.has(k)) lossMap.set(k, { cancellations: 0, cancellationCount: 0, refunds: 0, refundCount: 0 });
        cur2.setDate(cur2.getDate() + 1);
      }
      const lossesByDay: LossesByDayData[] = Array.from(lossMap.entries())
        .map(([date, d]) => ({
          date,
          dateDisplay: format(parseISO(date), "EEE, dd/MM", { locale: ptBR }),
          cancellations: d.cancellations,
          cancellationCount: d.cancellationCount,
          refunds: d.refunds,
          refundCount: d.refundCount,
          total: d.cancellations + d.refunds,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Não há mais truncamento — agregação é feita no backend
      const chartDataTruncated = false;

      return {
        kpis: {
          ...kpis,
          activePdvs,
          totalCancellations,
          cancelledTransactions,
          previousCancellationsTotal,
          previousRefunds,
        },
        hasData,
        globalMetrics,
        // Chart data
        salesByDay,
        salesByHourAndDay,
        topProductsChart,
        quickStats,
        lossesByDay,
        chartDataTruncated,
      };
    },
    enabled: !!profile?.id || isSuperAdmin,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    placeholderData: (previousData) => previousData,
  });

  return {
    data: dashboardQuery.data,
    isLoading: dashboardQuery.isLoading,
    isFetching: dashboardQuery.isFetching,
    error: dashboardQuery.error,
    refetch: dashboardQuery.refetch,
    isSuperAdmin,
  };
}
