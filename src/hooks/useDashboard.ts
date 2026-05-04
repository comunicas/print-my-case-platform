import { useQuery } from "@tanstack/react-query";
import { startOfDay, endOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { useUserAllowedPDVs } from "./useUserAllowedPDVs";
import {
  getSalesByDay,
  getSalesByHourAndDay,
  getTopProducts,
  getQuickStats,
  getLossesByDay,
  calculateKPIs,
  SaleRecord,
  SalesByDayData,
  HeatmapCell,
  TopProductData,
  QuickStatsData,
  LossesByDayData,
  CancellationRecord,
} from "@/lib/dashboardUtils";
import { DASHBOARD_SALES_LIMIT } from "@/lib/constants";

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

      // Query for full sales records (for charts) - limit to prevent performance issues
      let fullSalesRecordsQuery = supabase
        .from("sales_records")
        .select("id, payment_date, amount, refund_amount, product_name, payment_method, pdv_id")
        .gte("payment_date", startDate.toISOString())
        .lte("payment_date", endDate.toISOString())
        .eq("status", "Concluído")
        .order("payment_date", { ascending: true })
        .limit(DASHBOARD_SALES_LIMIT);

      let activePdvsQuery = supabase
        .from("pdvs")
        .select("id")
        .eq("status", "active");

      // Cancellations apenas para a série diária (LossesByDayChart)
      let currentCancellationsQuery = supabase
        .from("sales_records")
        .select("amount, payment_date")
        .gte("payment_date", startDate.toISOString())
        .lte("payment_date", endDate.toISOString())
        .eq("status", "Cancelado");

      // Apply PDV filter if needed
      if (pdvIds !== null) {
        const filterIds = pdvIds.length > 0 ? pdvIds : ["no-match"];
        fullSalesRecordsQuery = fullSalesRecordsQuery.in("pdv_id", filterIds);
        currentCancellationsQuery = currentCancellationsQuery.in("pdv_id", filterIds);
      }

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
        fullSalesRecordsResult,
        activePdvsResult,
        currentCancellationsResult,
      ] = await Promise.all([
        kpisRpc,
        fullSalesRecordsQuery,
        activePdvsQuery,
        currentCancellationsQuery,
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
      const currentCancellations = currentCancellationsResult.data || [];
      const hasData = transactions > 0;

      // Process full sales records for charts (apenas séries visuais)
      const salesRecordsRaw = fullSalesRecordsResult.data || [];
      const chartDataTruncated = transactions > DASHBOARD_SALES_LIMIT;
      const salesRecordsForCharts: SaleRecord[] = salesRecordsRaw.map((r) => ({
        id: r.id,
        payment_date: r.payment_date,
        amount: Number(r.amount),
        refund_amount: r.refund_amount ? Number(r.refund_amount) : null,
        product_name: r.product_name,
        payment_method: r.payment_method,
        pdv_id: r.pdv_id,
      }));

      // Calculate chart data using dashboardUtils functions
      const salesByDay = getSalesByDay(salesRecordsForCharts, startDate, endDate);
      const salesByHourAndDay = getSalesByHourAndDay(salesRecordsForCharts);
      const topProductsChart = getTopProducts(salesRecordsForCharts, 10);
      const quickStats = getQuickStats(salesRecordsForCharts);
      
      // Calculate losses by day for chart
      const cancellationsForChart: CancellationRecord[] = currentCancellations.map((c) => ({
        payment_date: c.payment_date,
        amount: Number(c.amount),
      }));
      const lossesByDay = getLossesByDay(
        salesRecordsForCharts,
        cancellationsForChart,
        startDate,
        endDate,
      );

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
