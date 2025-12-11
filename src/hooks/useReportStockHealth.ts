import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

// Classificação de saúde do slot por quantidade
type SlotHealthCategory = "critical" | "risk" | "good" | "healthy";

function getSlotHealthCategory(quantity: number): SlotHealthCategory {
  if (quantity === 0) return "critical";  // CRÍTICO
  if (quantity === 1) return "risk";      // RISCO
  if (quantity === 2) return "good";      // BOM
  return "healthy";                        // SAUDÁVEL (3+)
}

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
    criticalSlots: number;   // qty = 0
    riskSlots: number;       // qty = 1
    goodSlots: number;       // qty = 2
    healthySlots: number;    // qty >= 3
    criticalAlerts: number;
    warningAlerts: number;
  };
}

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

      // Category counters
      let criticalSlots = 0;
      let riskSlots = 0;
      let goodSlots = 0;
      let healthySlots = 0;

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
          
          // Classify slot by category
          const category = getSlotHealthCategory(record.quantity);
          switch (category) {
            case "critical":
              criticalSlots++;
              alerts.push({
                type: "rupture",
                product: record.product_name,
                slot: record.slot_number,
                pdv: pdvName,
                units: 0,
                severity: "critical",
              });
              break;
            case "risk":
              riskSlots++;
              alerts.push({
                type: "low",
                product: record.product_name,
                slot: record.slot_number,
                pdv: pdvName,
                units: record.quantity,
                severity: "warning",
              });
              break;
            case "good":
              goodSlots++;
              break;
            case "healthy":
              healthySlots++;
              break;
          }
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
      const totalActiveSlots = criticalSlots + riskSlots + goodSlots + healthySlots;
      const totals = {
        totalUnits: stockByPdv.reduce((acc, curr) => acc + curr.units, 0),
        totalActiveSlots,
        totalInactiveSlots: stockByPdv.reduce((acc, curr) => acc + curr.inactiveSlots, 0),
        criticalSlots,
        riskSlots,
        goodSlots,
        healthySlots,
        criticalAlerts: criticalSlots,
        warningAlerts: riskSlots,
      };

      // Calculate health score based on slot category proportions
      let healthScore = 100;
      
      if (totalActiveSlots > 0) {
        // Weights per category (higher weight = more negative impact)
        const criticalWeight = 1.0;   // 0 units - maximum impact
        const riskWeight = 0.5;       // 1 unit - medium impact
        const goodWeight = 0.1;       // 2 units - minimal impact
        // healthy (3+) doesn't penalize

        const criticalPenalty = (criticalSlots / totalActiveSlots) * criticalWeight * 100;
        const riskPenalty = (riskSlots / totalActiveSlots) * riskWeight * 100;
        const goodPenalty = (goodSlots / totalActiveSlots) * goodWeight * 100;

        healthScore = 100 - criticalPenalty - riskPenalty - goodPenalty;
      }

      healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));

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
