import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { useActiveOrg } from "@/contexts/ActiveOrgContext";
import { useFinancialEntries } from "./useFinancialEntries";
import { useDREConfig } from "./useDREConfig";
import { startOfMonth, endOfMonth, format } from "date-fns";

export interface DREData {
  receitaBruta: number;
  impostos: number;
  reembolsos: number;
  receitaLiquida: number;
  cmv: number;
  taxasStone: number;
  lucroBruto: number;
  despesasFixas: number;
  resultadoOperacional: number;
  implantacao: number;
  resultadoMes: number;
  // Metadata for labels
  salesCount: number;
  unitCost: number;
  stoneRate: number;
  taxRate: number;
  cardRevenue: number;
}

export type { FinancialEntry } from "./useFinancialEntries";


interface DRESalesSummaryRow {
  faturamento: number | string | null;
  deducoes: number | string | null;
  sales_count: number | string | null;
  card_revenue: number | string | null;
}

interface UseDREOptions {
  referenceMonth: Date;
  pdvId?: string | null;
}

export function useDRE({ referenceMonth, pdvId }: UseDREOptions) {
  const { profile } = useProfile();
  const { activeOrgId } = useActiveOrg();
  const isAllOrgs = activeOrgId === "all";
  const orgId = isAllOrgs ? null : (activeOrgId ?? profile?.organization_id);

  const monthStart = startOfMonth(referenceMonth);
  const monthEnd = endOfMonth(referenceMonth);
  const startStr = format(monthStart, "yyyy-MM-dd'T'00:00:00");
  const endStr = format(monthEnd, "yyyy-MM-dd'T'23:59:59");

  // Config de custos variáveis
  const { unitCost, stoneRate, taxRate, isLoading: configLoading } = useDREConfig({ pdvId });

  // Query de vendas do mês (via RPC)
  const salesQuery = useQuery({
    queryKey: ["dre-sales", orgId, startStr, endStr, pdvId],
    queryFn: async () => {
      let pdvQuery = supabase.from("pdvs").select("id");
      if (orgId) pdvQuery = pdvQuery.eq("organization_id", orgId);

      const { data: pdvs, error: pdvError } = await pdvQuery;
      if (pdvError) throw pdvError;

      const pdvIds = pdvId ? [pdvId] : pdvs.map((p) => p.id);
      if (pdvIds.length === 0) return { faturamento: 0, deducoes: 0, sales_count: 0, card_revenue: 0 };

      const { data, error } = await supabase.rpc("get_dre_sales_summary", {
        p_pdv_ids: pdvIds,
        p_start_date: startStr,
        p_end_date: endStr,
      });

      if (error) throw error;

      const row = (data?.[0] ?? null) as DRESalesSummaryRow | null;
      return {
        faturamento: Number(row?.faturamento) || 0,
        deducoes: Number(row?.deducoes) || 0,
        sales_count: Number(row?.sales_count) || 0,
        card_revenue: Number(row?.card_revenue) || 0,
      };
    },
    enabled: !!orgId || isAllOrgs,
  });

  // Dados de despesas manuais
  const { totalDeducoes, totalImplantacao, totalFixas, entriesByCategory, isLoading: entriesLoading } = useFinancialEntries({
    referenceMonth,
    pdvId,
  });

  const sales = salesQuery.data ?? { faturamento: 0, deducoes: 0, sales_count: 0, card_revenue: 0 };

  // Cálculos do DRE
  const receitaBruta = sales.faturamento;
  const impostos = receitaBruta * taxRate;
  const reembolsosAuto = sales.deducoes;
  const reembolsos = reembolsosAuto + totalDeducoes;
  const receitaLiquida = receitaBruta - impostos - reembolsos;
  const cmv = sales.sales_count * unitCost;
  const taxasStone = sales.card_revenue * stoneRate;
  const lucroBruto = receitaLiquida - cmv - taxasStone;
  const despesasFixas = totalFixas;
  const resultadoOperacional = lucroBruto - despesasFixas;
  const implantacao = totalImplantacao;
  const resultadoMes = resultadoOperacional - implantacao;

  // Entries enriquecidas com reembolsos automáticos
  const enrichedEntriesByCategory = {
    ...entriesByCategory,
    deducoes: [
      ...(reembolsosAuto > 0
        ? [{
            id: "auto-refunds",
            organization_id: orgId ?? "",
            pdv_id: null,
            category: "deducoes",
            description: "Reembolsos / Cancelamentos",
            amount: reembolsosAuto,
            reference_month: format(monthStart, "yyyy-MM-dd"),
            created_by: "",
            created_at: "",
            updated_at: "",
          }]
        : []),
      ...entriesByCategory.deducoes,
    ],
  };

  const dre: DREData = {
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
    salesCount: sales.sales_count,
    unitCost,
    stoneRate,
    taxRate,
    cardRevenue: sales.card_revenue,
  };

  return {
    dre,
    entriesByCategory: enrichedEntriesByCategory,
    isLoading: salesQuery.isLoading || entriesLoading || configLoading,
    error: salesQuery.error,
  };
}
