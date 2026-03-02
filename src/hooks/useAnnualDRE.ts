import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { useActiveOrg } from "@/contexts/ActiveOrgContext";
import { useDREConfig } from "./useDREConfig";
import type { DREData } from "./useDRE";

export interface MonthlyDREData extends DREData {
  monthLabel: string;
  monthIndex: number; // 0-11
}

export interface AnnualKPIs {
  receitaBrutaTotal: number;
  resultadoOperacionalTotal: number;
  margemBrutaMedia: number;
  margemOperacionalMedia: number;
}

interface UseAnnualDREOptions {
  year: number;
  pdvId?: string | null;
}

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function useAnnualDRE({ year, pdvId }: UseAnnualDREOptions) {
  const { profile } = useProfile();
  const { activeOrgId } = useActiveOrg();
  const isAllOrgs = activeOrgId === "all";
  const orgId = isAllOrgs ? null : (activeOrgId ?? profile?.organization_id);

  const { unitCost, stoneRate, taxRate, isLoading: configLoading } = useDREConfig({ pdvId });

  // Fetch annual sales via RPC
  const salesQuery = useQuery({
    queryKey: ["annual-dre-sales", orgId, year, pdvId],
    queryFn: async () => {
      let pdvQuery = supabase.from("pdvs").select("id");
      if (orgId) pdvQuery = pdvQuery.eq("organization_id", orgId);

      const { data: pdvs, error: pdvError } = await pdvQuery;
      if (pdvError) throw pdvError;

      const pdvIds = pdvId ? [pdvId] : pdvs.map((p) => p.id);
      if (pdvIds.length === 0) return [];

      const { data, error } = await (supabase as unknown as any).rpc("get_annual_dre_summary", {
        p_pdv_ids: pdvIds,
        p_year: year,
      });

      if (error) throw error;
      return (data ?? []) as Array<{
        month_start: string;
        faturamento: number;
        deducoes: number;
        sales_count: number;
        card_revenue: number;
      }>;
    },
    enabled: !!orgId || isAllOrgs,
  });

  // Fetch all financial entries for the year
  const entriesQuery = useQuery({
    queryKey: ["annual-financial-entries", orgId, year, pdvId],
    queryFn: async () => {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      let query = supabase
        .from("financial_entries")
        .select("*")
        .gte("reference_month", startDate)
        .lte("reference_month", endDate);

      if (orgId) query = query.eq("organization_id", orgId);
      if (pdvId) query = query.or(`pdv_id.eq.${pdvId},pdv_id.is.null`);

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!orgId || isAllOrgs,
  });

  // Build monthly DRE array
  const salesData = salesQuery.data ?? [];
  const entriesData = entriesQuery.data ?? [];

  const salesByMonth = new Map(
    salesData.map((s) => {
      const monthIdx = new Date(s.month_start).getUTCMonth();
      return [monthIdx, s];
    })
  );

  const entriesByMonth = new Map<number, { deducoes: number; fixas: number; implantacao: number }>();
  for (const e of entriesData) {
    const monthIdx = new Date(e.reference_month).getUTCMonth();
    const current = entriesByMonth.get(monthIdx) ?? { deducoes: 0, fixas: 0, implantacao: 0 };
    const cat = e.category as "deducoes" | "fixas" | "implantacao";
    if (cat in current) {
      current[cat] += Number(e.amount);
    }
    entriesByMonth.set(monthIdx, current);
  }

  const monthlyData: MonthlyDREData[] = Array.from({ length: 12 }, (_, i) => {
    const sales = salesByMonth.get(i);
    const entries = entriesByMonth.get(i) ?? { deducoes: 0, fixas: 0, implantacao: 0 };

    const receitaBruta = Number(sales?.faturamento ?? 0);
    const salesCount = Number(sales?.sales_count ?? 0);
    const cardRevenue = Number(sales?.card_revenue ?? 0);
    const reembolsosAuto = Number(sales?.deducoes ?? 0);

    const impostos = receitaBruta * taxRate;
    const reembolsos = reembolsosAuto + entries.deducoes;
    const receitaLiquida = receitaBruta - impostos - reembolsos;
    const cmv = salesCount * unitCost;
    const taxasStone = cardRevenue * stoneRate;
    const lucroBruto = receitaLiquida - cmv - taxasStone;
    const despesasFixas = entries.fixas;
    const resultadoOperacional = lucroBruto - despesasFixas;
    const implantacao = entries.implantacao;
    const resultadoMes = resultadoOperacional - implantacao;

    return {
      monthLabel: MONTH_LABELS[i],
      monthIndex: i,
      receitaBruta,
      impostos,
      reembolsos,
      receitaLiquida,
      cmv,
      taxasStone,
      lucroBruto,
      despesasFixas,
      resultadoOperacional,
      implantacao,
      resultadoMes,
      salesCount,
      unitCost,
      stoneRate,
      taxRate,
      cardRevenue,
    };
  });

  // Filter months with data for averages
  const monthsWithRevenue = monthlyData.filter((m) => m.receitaBruta > 0);

  const kpis: AnnualKPIs = {
    receitaBrutaTotal: monthlyData.reduce((s, m) => s + m.receitaBruta, 0),
    resultadoOperacionalTotal: monthlyData.reduce((s, m) => s + m.resultadoOperacional, 0),
    margemBrutaMedia:
      monthsWithRevenue.length > 0
        ? monthsWithRevenue.reduce((s, m) => s + (m.receitaBruta > 0 ? (m.lucroBruto / m.receitaBruta) * 100 : 0), 0) /
          monthsWithRevenue.length
        : 0,
    margemOperacionalMedia:
      monthsWithRevenue.length > 0
        ? monthsWithRevenue.reduce(
            (s, m) => s + (m.receitaBruta > 0 ? (m.resultadoOperacional / m.receitaBruta) * 100 : 0),
            0
          ) / monthsWithRevenue.length
        : 0,
  };

  return {
    monthlyData,
    kpis,
    isLoading: salesQuery.isLoading || entriesQuery.isLoading || configLoading,
  };
}
