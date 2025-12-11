import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

export interface StockHealthData {
  healthScore: number;
  alerts: {
    type: "rupture" | "low" | "stagnant";
    product: string;
    slot: string;
    pdv: string;
    units: number;
    daysStagnant?: number;
    severity: "critical" | "warning" | "info";
  }[];
  stockByPdv: {
    pdv: string;
    units: number;
    activeSlots: number;
    inactiveSlots: number;
  }[];
  turnoverRanking: {
    product: string;
    turnover: number;
    status: "excellent" | "good" | "average" | "low" | "critical";
  }[];
  inactiveSlots: {
    pdv: string;
    slot: string;
    reason: string;
    since: string;
  }[];
  totals: {
    totalUnits: number;
    totalActiveSlots: number;
    totalInactiveSlots: number;
    criticalAlerts: number;
    warningAlerts: number;
  };
}

const LOW_STOCK_THRESHOLD = 5;

export function useReportStockHealth() {
  const { profile } = useProfile();

  return useQuery({
    queryKey: ["report-stock-health", profile?.organization_id],
    queryFn: async (): Promise<StockHealthData> => {
      // Fetch stock records with PDV info
      const { data: stockData, error: stockError } = await supabase
        .from("stock_records")
        .select(`
          id,
          product_name,
          slot_number,
          quantity,
          is_active,
          pdv_id,
          upload_id,
          pdv:pdvs!inner(id, name)
        `);

      if (stockError) throw stockError;

      // Group by PDV
      const pdvMap = new Map<string, { pdv: string; units: number; activeSlots: Set<string>; inactiveSlots: Set<string> }>();
      const alerts: StockHealthData["alerts"] = [];
      const productStockMap = new Map<string, number>();
      const inactiveSlotsList: StockHealthData["inactiveSlots"] = [];

      stockData?.forEach(record => {
        const pdvId = record.pdv_id;
        const pdvName = (record.pdv as { id: string; name: string })?.name || "Desconhecido";
        const slotKey = `${pdvId}-${record.slot_number}`;

        // Initialize PDV entry
        if (!pdvMap.has(pdvId)) {
          pdvMap.set(pdvId, {
            pdv: pdvName,
            units: 0,
            activeSlots: new Set(),
            inactiveSlots: new Set(),
          });
        }

        const pdvEntry = pdvMap.get(pdvId)!;
        pdvEntry.units += record.quantity;

        if (record.is_active) {
          pdvEntry.activeSlots.add(record.slot_number);
        } else {
          pdvEntry.inactiveSlots.add(record.slot_number);
          inactiveSlotsList.push({
            pdv: pdvName,
            slot: record.slot_number,
            reason: "Slot desativado",
            since: "-",
          });
        }

        // Track product stock
        productStockMap.set(record.product_name, (productStockMap.get(record.product_name) || 0) + record.quantity);

        // Generate alerts
        if (record.is_active && record.quantity === 0) {
          alerts.push({
            type: "rupture",
            product: record.product_name,
            slot: record.slot_number,
            pdv: pdvName,
            units: 0,
            severity: "critical",
          });
        } else if (record.is_active && record.quantity > 0 && record.quantity < LOW_STOCK_THRESHOLD) {
          alerts.push({
            type: "low",
            product: record.product_name,
            slot: record.slot_number,
            pdv: pdvName,
            units: record.quantity,
            severity: "warning",
          });
        }
      });

      // Convert to stockByPdv array
      const stockByPdv = Array.from(pdvMap.values()).map(entry => ({
        pdv: entry.pdv,
        units: entry.units,
        activeSlots: entry.activeSlots.size,
        inactiveSlots: entry.inactiveSlots.size,
      })).sort((a, b) => b.units - a.units);

      // Fetch sales data for turnover calculation (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: salesData } = await supabase
        .from("sales_records")
        .select("product_name")
        .gte("payment_date", thirtyDaysAgo.toISOString());

      // Count sales by product
      const productSalesMap = new Map<string, number>();
      salesData?.forEach(sale => {
        productSalesMap.set(sale.product_name, (productSalesMap.get(sale.product_name) || 0) + 1);
      });

      // Calculate turnover (sales / stock)
      const turnoverRanking: StockHealthData["turnoverRanking"] = [];
      productStockMap.forEach((stock, product) => {
        const sales = productSalesMap.get(product) || 0;
        const turnover = stock > 0 ? sales / stock : 0;
        
        let status: "excellent" | "good" | "average" | "low" | "critical";
        if (turnover >= 5) status = "excellent";
        else if (turnover >= 3) status = "good";
        else if (turnover >= 1.5) status = "average";
        else if (turnover >= 0.5) status = "low";
        else status = "critical";

        turnoverRanking.push({
          product,
          turnover: Math.round(turnover * 10) / 10,
          status,
        });
      });

      turnoverRanking.sort((a, b) => b.turnover - a.turnover);

      // Calculate totals
      const totals = {
        totalUnits: stockByPdv.reduce((acc, curr) => acc + curr.units, 0),
        totalActiveSlots: stockByPdv.reduce((acc, curr) => acc + curr.activeSlots, 0),
        totalInactiveSlots: stockByPdv.reduce((acc, curr) => acc + curr.inactiveSlots, 0),
        criticalAlerts: alerts.filter(a => a.type === "rupture").length,
        warningAlerts: alerts.filter(a => a.type === "low").length,
      };

      // Calculate health score
      const ruptureCount = totals.criticalAlerts;
      const lowStockCount = totals.warningAlerts;
      const inactiveCount = totals.totalInactiveSlots;

      let healthScore = 100 - (ruptureCount * 10) - (lowStockCount * 5) - (inactiveCount * 2);
      healthScore = Math.max(0, Math.min(100, healthScore));

      return {
        healthScore,
        alerts: alerts.slice(0, 10), // Limit to 10 alerts
        stockByPdv,
        turnoverRanking: turnoverRanking.slice(0, 7), // Top 7
        inactiveSlots: inactiveSlotsList.slice(0, 10),
        totals,
      };
    },
    enabled: !!profile?.organization_id,
  });
}
