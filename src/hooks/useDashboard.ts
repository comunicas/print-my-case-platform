import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

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
  paymentMethods: { method: string; value: number; fill: string }[];
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
}

const PAYMENT_COLORS: Record<string, string> = {
  "Pix": "hsl(var(--chart-1))",
  "Crédito": "hsl(var(--chart-2))",
  "Débito": "hsl(var(--chart-3))",
  "Dinheiro": "hsl(var(--chart-4))",
  "Outro": "hsl(var(--chart-5))",
};

export function useDashboard() {
  const { profile } = useProfile();

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", profile?.organization_id],
    queryFn: async (): Promise<DashboardData> => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      // Fetch all data in parallel
      const [
        currentSalesResult,
        previousSalesResult,
        revenueByMonthResult,
        salesByPdvResult,
        paymentMethodsResult,
        stockByPdvResult,
        topProductsResult,
        stockAlertsResult,
        recentUploadsResult,
        activePdvsResult,
      ] = await Promise.all([
        // Current period sales (last 30 days)
        supabase
          .from("sales_records")
          .select("amount, refund_amount")
          .gte("payment_date", thirtyDaysAgo.toISOString()),

        // Previous period sales (30-60 days ago)
        supabase
          .from("sales_records")
          .select("amount, refund_amount")
          .gte("payment_date", sixtyDaysAgo.toISOString())
          .lt("payment_date", thirtyDaysAgo.toISOString()),

        // Revenue by month (last 6 months)
        supabase
          .from("sales_records")
          .select("payment_date, amount, refund_amount")
          .gte("payment_date", new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString()),

        // Sales by PDV
        supabase
          .from("sales_records")
          .select("pdv_id, amount, refund_amount, pdv:pdvs(name)")
          .gte("payment_date", thirtyDaysAgo.toISOString()),

        // Payment methods
        supabase
          .from("sales_records")
          .select("payment_method")
          .gte("payment_date", thirtyDaysAgo.toISOString()),

        // Stock by PDV
        supabase
          .from("stock_records")
          .select("pdv_id, quantity, pdv:pdvs(name)")
          .eq("is_active", true),

        // Top products
        supabase
          .from("sales_records")
          .select("product_name")
          .gte("payment_date", thirtyDaysAgo.toISOString()),

        // Stock alerts
        supabase
          .from("stock_records")
          .select("quantity, product_name")
          .eq("is_active", true),

        // Recent uploads
        supabase
          .from("uploads")
          .select("id, type, status, uploaded_at, records_count, pdv:pdvs(name)")
          .order("uploaded_at", { ascending: false })
          .limit(3),

        // Active PDVs count
        supabase
          .from("pdvs")
          .select("id")
          .eq("status", "active"),
      ]);

      // Calculate KPIs
      const currentSales = currentSalesResult.data || [];
      const previousSales = previousSalesResult.data || [];

      const totalRevenue = currentSales.reduce(
        (sum, r) => sum + (Number(r.amount) - Number(r.refund_amount || 0)),
        0
      );
      const transactions = currentSales.length;
      const avgTicket = transactions > 0 ? totalRevenue / transactions : 0;
      const activePdvs = activePdvsResult.data?.length || 0;

      const previousRevenue = previousSales.reduce(
        (sum, r) => sum + (Number(r.amount) - Number(r.refund_amount || 0)),
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
      
      (revenueByMonthResult.data || []).forEach((record) => {
        const date = new Date(record.payment_date);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        const monthLabel = monthNames[date.getMonth()];
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
      (salesByPdvResult.data || []).forEach((record: any) => {
        const pdvName = record.pdv?.name || "Desconhecido";
        const current = pdvSalesMap.get(pdvName) || 0;
        pdvSalesMap.set(pdvName, current + (Number(record.amount) - Number(record.refund_amount || 0)));
      });
      const salesByPdv = Array.from(pdvSalesMap.entries()).map(([pdv, revenue]) => ({ pdv, revenue }));

      // Process payment methods
      const methodsMap = new Map<string, number>();
      (paymentMethodsResult.data || []).forEach((record) => {
        const method = record.payment_method || "Outro";
        methodsMap.set(method, (methodsMap.get(method) || 0) + 1);
      });
      const totalMethods = Array.from(methodsMap.values()).reduce((a, b) => a + b, 0);
      const paymentMethods = Array.from(methodsMap.entries()).map(([method, count]) => ({
        method,
        value: totalMethods > 0 ? Math.round((count / totalMethods) * 100) : 0,
        fill: PAYMENT_COLORS[method] || PAYMENT_COLORS["Outro"],
      }));

      // Process stock by PDV
      const stockMap = new Map<string, number>();
      (stockByPdvResult.data || []).forEach((record: any) => {
        const pdvName = record.pdv?.name || "Desconhecido";
        stockMap.set(pdvName, (stockMap.get(pdvName) || 0) + Number(record.quantity));
      });
      const stockByPdv = Array.from(stockMap.entries()).map(([pdv, units]) => ({ pdv, units }));

      // Process top products
      const productsMap = new Map<string, number>();
      (topProductsResult.data || []).forEach((record) => {
        productsMap.set(record.product_name, (productsMap.get(record.product_name) || 0) + 1);
      });
      const topProducts = Array.from(productsMap.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([product, quantity]) => ({ product, quantity }));

      // Process stock alerts
      const stockRecords = stockAlertsResult.data || [];
      const rupture = new Set(stockRecords.filter((r) => r.quantity === 0).map((r) => r.product_name)).size;
      const lowStock = new Set(stockRecords.filter((r) => r.quantity > 0 && r.quantity < 5).map((r) => r.product_name)).size;
      const stagnant = 0; // Would need date tracking to calculate

      // Process recent uploads
      const recentUploads = (recentUploadsResult.data || []).map((upload: any) => ({
        id: upload.id,
        type: upload.type as "sales" | "stock",
        pdv: upload.pdv?.name || "Desconhecido",
        status: upload.status || "processing",
        date: upload.uploaded_at,
        records: upload.records_count || 0,
      }));

      const hasData = currentSales.length > 0 || stockRecords.length > 0;

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
      };
    },
    enabled: !!profile?.organization_id,
  });

  return {
    data: dashboardQuery.data,
    isLoading: dashboardQuery.isLoading,
    error: dashboardQuery.error,
  };
}
