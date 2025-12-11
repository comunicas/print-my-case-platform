import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

export interface ProductsReportData {
  topProducts: {
    name: string;
    quantity: number;
    revenue: number;
    avgPrice: number;
    trend: number;
  }[];
  bottomProducts: {
    name: string;
    quantity: number;
    revenue: number;
    avgPrice: number;
    daysWithoutSale: number;
  }[];
  categoryData: {
    name: string;
    value: number;
    fill: string;
  }[];
  totals: {
    totalSold: number;
    totalRevenue: number;
    avgTicket: number;
  };
}

interface UseReportProductsParams {
  startDate: Date | undefined;
  endDate: Date | undefined;
  selectedPdv: string;
  viewMode: "top" | "bottom";
}

const CATEGORY_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function useReportProducts({ startDate, endDate, selectedPdv }: UseReportProductsParams) {
  const { profile } = useProfile();

  return useQuery({
    queryKey: ["report-products", profile?.organization_id, startDate?.toISOString(), endDate?.toISOString(), selectedPdv],
    queryFn: async (): Promise<ProductsReportData> => {
      if (!startDate || !endDate) {
        return {
          topProducts: [],
          bottomProducts: [],
          categoryData: [],
          totals: { totalSold: 0, totalRevenue: 0, avgTicket: 0 },
        };
      }

      // Build query
      let query = supabase
        .from("sales_records")
        .select("product_name, amount, refund_amount, payment_date, pdv_id")
        .gte("payment_date", startDate.toISOString())
        .lte("payment_date", endDate.toISOString());

      if (selectedPdv !== "all") {
        query = query.eq("pdv_id", selectedPdv);
      }

      const { data: salesData, error } = await query;
      if (error) throw error;

      // Group by product
      const productMap = new Map<string, { quantity: number; revenue: number; lastSaleDate: Date }>();
      
      salesData?.forEach(sale => {
        const productName = sale.product_name;
        const netAmount = Number(sale.amount) - Number(sale.refund_amount || 0);
        const saleDate = new Date(sale.payment_date);

        if (productMap.has(productName)) {
          const existing = productMap.get(productName)!;
          existing.quantity += 1;
          existing.revenue += netAmount;
          if (saleDate > existing.lastSaleDate) {
            existing.lastSaleDate = saleDate;
          }
        } else {
          productMap.set(productName, {
            quantity: 1,
            revenue: netAmount,
            lastSaleDate: saleDate,
          });
        }
      });

      // Calculate previous period for trend
      const periodLength = endDate.getTime() - startDate.getTime();
      const previousStart = new Date(startDate.getTime() - periodLength);
      const previousEnd = new Date(startDate.getTime() - 1);

      let previousQuery = supabase
        .from("sales_records")
        .select("product_name, amount, refund_amount")
        .gte("payment_date", previousStart.toISOString())
        .lte("payment_date", previousEnd.toISOString());

      if (selectedPdv !== "all") {
        previousQuery = previousQuery.eq("pdv_id", selectedPdv);
      }

      const { data: previousSalesData } = await previousQuery;

      const previousProductMap = new Map<string, number>();
      previousSalesData?.forEach(sale => {
        const productName = sale.product_name;
        previousProductMap.set(productName, (previousProductMap.get(productName) || 0) + 1);
      });

      // Build products array
      const allProducts = Array.from(productMap.entries()).map(([name, data]) => {
        const previousQuantity = previousProductMap.get(name) || 0;
        const trend = previousQuantity > 0
          ? ((data.quantity - previousQuantity) / previousQuantity) * 100
          : 0;
        
        const now = new Date();
        const daysWithoutSale = Math.floor((now.getTime() - data.lastSaleDate.getTime()) / (1000 * 60 * 60 * 24));

        return {
          name,
          quantity: data.quantity,
          revenue: data.revenue,
          avgPrice: data.quantity > 0 ? data.revenue / data.quantity : 0,
          trend: Math.round(trend),
          daysWithoutSale,
        };
      });

      // Sort for top and bottom
      const topProducts = [...allProducts]
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 8);

      const bottomProducts = [...allProducts]
        .sort((a, b) => a.quantity - b.quantity)
        .slice(0, 5);

      // Calculate category data (heuristic based on product names)
      const categoryMap = new Map<string, number>();
      allProducts.forEach(product => {
        const name = product.name.toLowerCase();
        let category = "Outros";
        
        if (name.includes("capinha") || name.includes("capa")) {
          category = "Capinhas";
        } else if (name.includes("carregador") || name.includes("charger")) {
          category = "Carregadores";
        } else if (name.includes("fone") || name.includes("earphone") || name.includes("headphone")) {
          category = "Fones";
        } else if (name.includes("cabo") || name.includes("cable")) {
          category = "Cabos";
        } else if (name.includes("película") || name.includes("pelicula")) {
          category = "Películas";
        }

        categoryMap.set(category, (categoryMap.get(category) || 0) + product.quantity);
      });

      const totalQuantity = Array.from(categoryMap.values()).reduce((a, b) => a + b, 0);
      const categoryData = Array.from(categoryMap.entries())
        .map(([name, value], index) => ({
          name,
          value: totalQuantity > 0 ? Math.round((value / totalQuantity) * 100) : 0,
          fill: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
        }))
        .sort((a, b) => b.value - a.value);

      // Calculate totals
      const totals = {
        totalSold: allProducts.reduce((acc, curr) => acc + curr.quantity, 0),
        totalRevenue: allProducts.reduce((acc, curr) => acc + curr.revenue, 0),
        avgTicket: 0,
      };
      totals.avgTicket = totals.totalSold > 0 ? totals.totalRevenue / totals.totalSold : 0;

      return { topProducts, bottomProducts, categoryData, totals };
    },
    enabled: !!profile?.organization_id,
  });
}
