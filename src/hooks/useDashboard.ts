import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import {
  getSalesByDay,
  getSalesByHourAndDay,
  getTopProducts,
  getQuickStats,
  SaleRecord,
  SalesByDayData,
  HeatmapCell,
  TopProductData,
  QuickStatsData,
} from "@/lib/dashboardUtils";

export interface DashboardData {
  kpis: {
    totalRevenue: number;
    transactions: number;
    avgTicket: number;
    activePdvs: number;
    revenueChange: number;
    transactionsChange: number;
  };
  hasData: boolean;
  globalMetrics?: {
    totalOrganizations: number;
    totalPdvsGlobal: number;
    totalRevenueGlobal: number;
    totalTransactionsGlobal: number;
  };
  // Chart data
  salesByDay: SalesByDayData[];
  salesByHourAndDay: HeatmapCell[];
  topProductsChart: TopProductData[];
  quickStats: QuickStatsData;
}

interface UseDashboardParams {
  selectedOrganizationId?: string | "all";
  dateRange?: { from: Date; to: Date };
}

export function useDashboard({ selectedOrganizationId, dateRange }: UseDashboardParams = {}) {
  const { profile, role } = useProfile();
  const isSuperAdmin = role === "super_admin";

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", profile?.organization_id, selectedOrganizationId, isSuperAdmin, dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    queryFn: async (): Promise<DashboardData> => {
      const now = new Date();
      // Use dateRange if provided, otherwise default to 30 days
      const startDate = dateRange?.from || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const endDate = dateRange?.to || now;
      
      // Calculate previous period for comparison
      const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
      const previousStartDate = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000);
      const previousEndDate = new Date(startDate.getTime() - 1);

      // Determine which PDVs to query based on role and filter
      let pdvIds: string[] | null = null;
      
      if (!isSuperAdmin || (selectedOrganizationId && selectedOrganizationId !== "all")) {
        const orgIdToFilter = selectedOrganizationId && selectedOrganizationId !== "all" 
          ? selectedOrganizationId 
          : profile?.organization_id;
        
        // Para usuários não-admin, verificar atribuições específicas primeiro
        if (!isSuperAdmin && profile?.id) {
          const { data: userPdvs } = await supabase
            .from("user_pdvs")
            .select("pdv_id")
            .eq("user_id", profile.id);
          
          if (userPdvs && userPdvs.length > 0) {
            pdvIds = userPdvs.map(p => p.pdv_id);
          }
        }
        
        // Se não tem atribuições específicas, usar organization_id
        if (pdvIds === null && orgIdToFilter) {
          const { data: pdvs } = await supabase
            .from("pdvs")
            .select("id")
            .eq("organization_id", orgIdToFilter);
          pdvIds = pdvs?.map(p => p.id) || [];
        }
      }

      // Build base queries
      let currentSalesQuery = supabase
        .from("sales_records")
        .select("amount, refund_amount")
        .gte("payment_date", startDate.toISOString())
        .lte("payment_date", endDate.toISOString());

      let previousSalesQuery = supabase
        .from("sales_records")
        .select("amount, refund_amount")
        .gte("payment_date", previousStartDate.toISOString())
        .lte("payment_date", previousEndDate.toISOString());

      // Query for full sales records (for charts)
      let fullSalesRecordsQuery = supabase
        .from("sales_records")
        .select("id, payment_date, amount, refund_amount, product_name, payment_method, pdv_id")
        .gte("payment_date", startDate.toISOString())
        .lte("payment_date", endDate.toISOString())
        .order("payment_date", { ascending: true });

      let activePdvsQuery = supabase
        .from("pdvs")
        .select("id")
        .eq("status", "active");

      // Apply PDV filter if needed
      if (pdvIds !== null) {
        const filterIds = pdvIds.length > 0 ? pdvIds : ["no-match"];
        currentSalesQuery = currentSalesQuery.in("pdv_id", filterIds);
        previousSalesQuery = previousSalesQuery.in("pdv_id", filterIds);
        fullSalesRecordsQuery = fullSalesRecordsQuery.in("pdv_id", filterIds);
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

      // Fetch all data in parallel (reduced from 11 to 4 queries)
      const [
        currentSalesResult,
        previousSalesResult,
        fullSalesRecordsResult,
        activePdvsResult,
      ] = await Promise.all([
        currentSalesQuery,
        previousSalesQuery,
        fullSalesRecordsQuery,
        activePdvsQuery,
      ]);

      // Fetch global metrics for super_admin
      let globalMetrics: DashboardData["globalMetrics"] = undefined;
      if (isSuperAdmin) {
        const [orgsResult, globalPdvsResult, globalSalesResult] = await Promise.all([
          supabase.from("organizations").select("id", { count: "exact", head: true }),
          supabase.from("pdvs").select("id", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("sales_records").select("amount, refund_amount").gte("payment_date", startDate.toISOString()).lte("payment_date", endDate.toISOString()),
        ]);
        
        const globalSalesData = globalSalesResult.data || [];
        const totalRevenueGlobal = globalSalesData.reduce(
          (sum: number, r: any) => sum + (Number(r.amount) - Number(r.refund_amount || 0)),
          0
        );
        globalMetrics = {
          totalOrganizations: orgsResult.count || 0,
          totalPdvsGlobal: globalPdvsResult.count || 0,
          totalRevenueGlobal,
          totalTransactionsGlobal: globalSalesData.length,
        };
      }

      // Calculate KPIs
      const currentSales = currentSalesResult.data || [];
      const previousSales = previousSalesResult.data || [];

      const totalRevenue = currentSales.reduce(
        (sum: number, r: any) => sum + (Number(r.amount) - Number(r.refund_amount || 0)),
        0
      );
      const transactions = currentSales.length;
      const avgTicket = transactions > 0 ? totalRevenue / transactions : 0;
      const activePdvs = activePdvsResult.data?.length || 0;

      const previousRevenue = previousSales.reduce(
        (sum: number, r: any) => sum + (Number(r.amount) - Number(r.refund_amount || 0)),
        0
      );
      const previousTransactions = previousSales.length;

      const revenueChange = previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : 0;
      const transactionsChange = previousTransactions > 0
        ? ((transactions - previousTransactions) / previousTransactions) * 100
        : 0;

      const hasData = currentSales.length > 0;

      // Process full sales records for charts
      const salesRecordsRaw = fullSalesRecordsResult.data || [];
      const salesRecordsForCharts: SaleRecord[] = salesRecordsRaw.map((r: any) => ({
        id: r.id,
        payment_date: r.payment_date,
        amount: Number(r.amount),
        refund_amount: r.refund_amount ? Number(r.refund_amount) : null,
        product_name: r.product_name,
        payment_method: r.payment_method,
        pdv_id: r.pdv_id,
      }));

      // Calculate chart data using dashboardUtils functions
      const salesByDay = getSalesByDay(salesRecordsForCharts);
      const salesByHourAndDay = getSalesByHourAndDay(salesRecordsForCharts);
      const topProductsChart = getTopProducts(salesRecordsForCharts, 10);
      const quickStats = getQuickStats(salesRecordsForCharts);

      return {
        kpis: {
          totalRevenue,
          transactions,
          avgTicket,
          activePdvs,
          revenueChange,
          transactionsChange,
        },
        hasData,
        globalMetrics,
        // Chart data
        salesByDay,
        salesByHourAndDay,
        topProductsChart,
        quickStats,
      };
    },
    enabled: !!profile?.id || isSuperAdmin,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    data: dashboardQuery.data,
    isLoading: dashboardQuery.isLoading,
    error: dashboardQuery.error,
    isSuperAdmin,
  };
}
