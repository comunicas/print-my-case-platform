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
  revenueByMonth: { month: string; revenue: number }[];
  salesByPdv: { pdv: string; revenue: number }[];
  paymentMethods: { method: string; value: number; count: number; fill: string }[];
  stockByPdv: { pdv: string; units: number }[];
  topProducts: { product: string; quantity: number }[];
  stockAlerts: { rupture: number; lowStock: number; stagnant: number };
  recentUploads: {
    id: string;
    type: "sales" | "stock";
    pdv: string;
    status: string;
    date: string;
    records: number;
  }[];
  hasData: boolean;
  globalMetrics?: {
    totalOrganizations: number;
    totalPdvsGlobal: number;
    totalRevenueGlobal: number;
    totalTransactionsGlobal: number;
  };
  // New processed data for charts
  salesRecords: SaleRecord[];
  salesByDay: SalesByDayData[];
  salesByHourAndDay: HeatmapCell[];
  topProductsChart: TopProductData[];
  quickStats: QuickStatsData;
}

interface SalesRecordWithPdv {
  pdv_id: string;
  amount: number;
  refund_amount: number | null;
  pdv: { name: string } | null;
}

interface StockRecordWithPdv {
  pdv_id: string;
  quantity: number;
  pdv: { name: string } | null;
}

interface UploadWithPdv {
  id: string;
  type: "sales" | "stock";
  status: string | null;
  uploaded_at: string | null;
  records_count: number | null;
  pdv: { name: string } | null;
}

const PAYMENT_COLORS: Record<string, string> = {
  "Pix": "hsl(var(--chart-1))",
  "Cartão": "hsl(var(--chart-2))",
  "Débito": "hsl(var(--chart-3))",
  "Dinheiro": "hsl(var(--chart-4))",
  "Outro": "hsl(var(--chart-5))",
};

function normalizePaymentMethod(method: string | null): string {
  if (!method) return "Outro";
  const lower = method.toLowerCase();
  if (lower.includes("pix")) return "Pix";
  if (lower.includes("crédito") || lower.includes("credit") || lower.includes("pos") || lower.includes("cartão")) return "Cartão";
  if (lower.includes("débito") || lower.includes("debit")) return "Débito";
  if (lower.includes("dinheiro") || lower.includes("cash") || lower.includes("espécie")) return "Dinheiro";
  return "Outro";
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
        
        if (orgIdToFilter) {
          const { data: pdvs } = await supabase
            .from("pdvs")
            .select("id")
            .eq("organization_id", orgIdToFilter);
          pdvIds = pdvs?.map(p => p.id) || [];
        }
      }

      // Build base queries - use startDate/endDate for current period
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

      let revenueByMonthQuery = supabase
        .from("sales_records")
        .select("payment_date, amount, refund_amount")
        .gte("payment_date", new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString());

      let salesByPdvQuery = supabase
        .from("sales_records")
        .select("pdv_id, amount, refund_amount, pdv:pdvs(name)")
        .gte("payment_date", startDate.toISOString())
        .lte("payment_date", endDate.toISOString());

      let paymentMethodsQuery = supabase
        .from("sales_records")
        .select("payment_method")
        .gte("payment_date", startDate.toISOString())
        .lte("payment_date", endDate.toISOString());

      let stockByPdvQuery = supabase
        .from("stock_records")
        .select("pdv_id, quantity, pdv:pdvs(name)")
        .eq("is_active", true);

      let topProductsQuery = supabase
        .from("sales_records")
        .select("product_name")
        .gte("payment_date", startDate.toISOString())
        .lte("payment_date", endDate.toISOString());

      let stockAlertsQuery = supabase
        .from("stock_records")
        .select("quantity, product_name")
        .eq("is_active", true);

      let recentUploadsQuery = supabase
        .from("uploads")
        .select("id, type, status, uploaded_at, records_count, pdv:pdvs(name)")
        .order("uploaded_at", { ascending: false })
        .limit(3);

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
        revenueByMonthQuery = revenueByMonthQuery.in("pdv_id", filterIds);
        salesByPdvQuery = salesByPdvQuery.in("pdv_id", filterIds);
        paymentMethodsQuery = paymentMethodsQuery.in("pdv_id", filterIds);
        stockByPdvQuery = stockByPdvQuery.in("pdv_id", filterIds);
        topProductsQuery = topProductsQuery.in("pdv_id", filterIds);
        stockAlertsQuery = stockAlertsQuery.in("pdv_id", filterIds);
        recentUploadsQuery = recentUploadsQuery.in("pdv_id", filterIds);
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
        revenueByMonthResult,
        salesByPdvResult,
        paymentMethodsResult,
        stockByPdvResult,
        topProductsResult,
        stockAlertsResult,
        recentUploadsResult,
        activePdvsResult,
      ] = await Promise.all([
        currentSalesQuery,
        previousSalesQuery,
        fullSalesRecordsQuery,
        revenueByMonthQuery,
        salesByPdvQuery,
        paymentMethodsQuery,
        stockByPdvQuery,
        topProductsQuery,
        stockAlertsQuery,
        recentUploadsQuery,
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

      // Process revenue by month
      const monthlyData = new Map<string, number>();
      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      
      (revenueByMonthResult.data || []).forEach((record: any) => {
        const date = new Date(record.payment_date);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        const current = monthlyData.get(monthKey) || 0;
        monthlyData.set(monthKey, current + (Number(record.amount) - Number(record.refund_amount || 0)));
      });

      const revenueByMonth = Array.from(monthlyData.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([key, revenue]) => ({
          month: monthNames[parseInt(key.split("-")[1])],
          revenue,
        }));

      // Process sales by PDV
      const pdvSalesMap = new Map<string, number>();
      ((salesByPdvResult.data || []) as SalesRecordWithPdv[]).forEach((record) => {
        const pdvName = record.pdv?.name || "Desconhecido";
        const current = pdvSalesMap.get(pdvName) || 0;
        pdvSalesMap.set(pdvName, current + (Number(record.amount) - Number(record.refund_amount || 0)));
      });
      const salesByPdv = Array.from(pdvSalesMap.entries()).map(([pdv, revenue]) => ({ pdv, revenue }));

      // Process payment methods with normalization
      const methodsMap = new Map<string, number>();
      (paymentMethodsResult.data || []).forEach((record: any) => {
        const method = normalizePaymentMethod(record.payment_method);
        methodsMap.set(method, (methodsMap.get(method) || 0) + 1);
      });
      const totalMethods = Array.from(methodsMap.values()).reduce((a, b) => a + b, 0);
      const paymentMethods = Array.from(methodsMap.entries()).map(([method, count]) => ({
        method,
        value: totalMethods > 0 ? Math.round((count / totalMethods) * 100) : 0,
        count,
        fill: PAYMENT_COLORS[method] || PAYMENT_COLORS["Outro"],
      }));

      // Process stock by PDV
      const stockMap = new Map<string, number>();
      ((stockByPdvResult.data || []) as StockRecordWithPdv[]).forEach((record) => {
        const pdvName = record.pdv?.name || "Desconhecido";
        stockMap.set(pdvName, (stockMap.get(pdvName) || 0) + Number(record.quantity));
      });
      const stockByPdv = Array.from(stockMap.entries()).map(([pdv, units]) => ({ pdv, units }));

      // Process top products
      const productsMap = new Map<string, number>();
      (topProductsResult.data || []).forEach((record: any) => {
        productsMap.set(record.product_name, (productsMap.get(record.product_name) || 0) + 1);
      });
      const topProducts = Array.from(productsMap.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([product, quantity]) => ({ product, quantity }));

      // Process stock alerts
      const stockRecords = stockAlertsResult.data || [];
      const rupture = new Set(stockRecords.filter((r: any) => r.quantity === 0).map((r: any) => r.product_name)).size;
      const lowStock = new Set(stockRecords.filter((r: any) => r.quantity > 0 && r.quantity < 5).map((r: any) => r.product_name)).size;
      const stagnant = 0;

      // Process recent uploads
      const recentUploads = ((recentUploadsResult.data || []) as UploadWithPdv[]).map((upload) => ({
        id: upload.id,
        type: upload.type,
        pdv: upload.pdv?.name || "Desconhecido",
        status: upload.status || "processing",
        date: upload.uploaded_at || "",
        records: upload.records_count || 0,
      }));

      const hasData = currentSales.length > 0 || stockRecords.length > 0;

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
        revenueByMonth,
        salesByPdv,
        paymentMethods,
        stockByPdv,
        topProducts,
        stockAlerts: { rupture, lowStock, stagnant },
        recentUploads,
        hasData,
        globalMetrics,
        // New chart data
        salesRecords: salesRecordsForCharts,
        salesByDay,
        salesByHourAndDay,
        topProductsChart,
        quickStats,
      };
    },
    enabled: !!profile?.organization_id || isSuperAdmin,
  });

  return {
    data: dashboardQuery.data,
    isLoading: dashboardQuery.isLoading,
    error: dashboardQuery.error,
    isSuperAdmin,
  };
}
