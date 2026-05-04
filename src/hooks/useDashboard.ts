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

      // Build base queries - only include successful sales (canonical PT-BR status)
      let currentSalesQuery = supabase
        .from("sales_records")
        .select("amount, refund_amount")
        .gte("payment_date", startDate.toISOString())
        .lte("payment_date", endDate.toISOString())
        .eq("status", "Concluído");

      let previousSalesQuery = supabase
        .from("sales_records")
        .select("amount, refund_amount")
        .gte("payment_date", previousStartDate.toISOString())
        .lte("payment_date", previousEndDate.toISOString())
        .eq("status", "Concluído");

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

      // Queries for cancelled transactions (canonical PT-BR status)
      let currentCancellationsQuery = supabase
        .from("sales_records")
        .select("amount, payment_date")
        .gte("payment_date", startDate.toISOString())
        .lte("payment_date", endDate.toISOString())
        .eq("status", "Cancelado");

      let previousCancellationsQuery = supabase
        .from("sales_records")
        .select("amount")
        .gte("payment_date", previousStartDate.toISOString())
        .lte("payment_date", previousEndDate.toISOString())
        .eq("status", "Cancelado");

      // Apply PDV filter if needed
      if (pdvIds !== null) {
        const filterIds = pdvIds.length > 0 ? pdvIds : ["no-match"];
        currentSalesQuery = currentSalesQuery.in("pdv_id", filterIds);
        previousSalesQuery = previousSalesQuery.in("pdv_id", filterIds);
        fullSalesRecordsQuery = fullSalesRecordsQuery.in("pdv_id", filterIds);
        currentCancellationsQuery = currentCancellationsQuery.in("pdv_id", filterIds);
        previousCancellationsQuery = previousCancellationsQuery.in("pdv_id", filterIds);
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
        currentSalesResult,
        previousSalesResult,
        fullSalesRecordsResult,
        activePdvsResult,
        currentCancellationsResult,
        previousCancellationsResult,
      ] = await Promise.all([
        currentSalesQuery,
        previousSalesQuery,
        fullSalesRecordsQuery,
        activePdvsQuery,
        currentCancellationsQuery,
        previousCancellationsQuery,
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

      // Calculate KPIs using utility functions
      const currentSales = currentSalesResult.data || [];
      const previousSales = previousSalesResult.data || [];
      const kpis = calculateKPIs(currentSales, previousSales);
      const activePdvs = activePdvsResult.data?.length || 0;

      // Calculate cancellation metrics
      const currentCancellations = currentCancellationsResult.data || [];
      const previousCancellations = previousCancellationsResult.data || [];
      
      const totalCancellations = currentCancellations.reduce(
        (sum, record) => sum + Number(record.amount || 0), 0
      );
      const cancelledTransactions = currentCancellations.length;
      
      const previousCancellationsTotal = previousCancellations.reduce(
        (sum, record) => sum + Number(record.amount || 0), 0
      );
      

      const hasData = currentSales.length > 0;

      // Process full sales records for charts
      const salesRecordsRaw = fullSalesRecordsResult.data || [];
      const chartDataTruncated = salesRecordsRaw.length >= DASHBOARD_SALES_LIMIT;
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

      const previousRefunds = previousSales.reduce(
        (sum, record) => sum + Number(record.refund_amount || 0),
        0
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
