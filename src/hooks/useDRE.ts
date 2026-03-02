import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { useActiveOrg } from "@/contexts/ActiveOrgContext";
import { useFinancialEntries } from "./useFinancialEntries";
import { startOfMonth, endOfMonth, format } from "date-fns";

export interface DREData {
  faturamentoBruto: number;
  deducoes: number;
  receitaLiquida: number;
  despesasImplantacao: number;
  despesasFixas: number;
  resultadoOperacional: number;
}

export type { FinancialEntry } from "./useFinancialEntries";

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

  // Query de vendas do mês (via RPC para evitar limite de 1000 linhas)
  const salesQuery = useQuery({
    queryKey: ["dre-sales", orgId, startStr, endStr, pdvId],
    queryFn: async () => {
      // Buscar PDVs da org (ou todos se "all")
      let pdvQuery = supabase
        .from("pdvs")
        .select("id");

      if (orgId) {
        pdvQuery = pdvQuery.eq("organization_id", orgId);
      }

      const { data: pdvs, error: pdvError } = await pdvQuery;
      if (pdvError) throw pdvError;

      const pdvIds = pdvId ? [pdvId] : pdvs.map((p) => p.id);
      if (pdvIds.length === 0) return { faturamento: 0, deducoes: 0 };

      const { data, error } = await supabase.rpc("get_dre_sales_summary", {
        p_pdv_ids: pdvIds,
        p_start_date: startStr,
        p_end_date: endStr,
      });

      if (error) throw error;

      const row = data?.[0];
      return {
        faturamento: Number(row?.faturamento) || 0,
        deducoes: Number(row?.deducoes) || 0,
      };
    },
    enabled: !!orgId || isAllOrgs,
  });

  // Dados de despesas manuais
  const { totalDeducoes, totalImplantacao, totalFixas, entriesByCategory, isLoading: entriesLoading } = useFinancialEntries({
    referenceMonth,
    pdvId,
  });

  const faturamento = salesQuery.data?.faturamento ?? 0;
  const deducoesAuto = salesQuery.data?.deducoes ?? 0;
  const deducoesTotal = deducoesAuto + totalDeducoes;
  const receitaLiquida = faturamento - deducoesTotal;
  const resultadoOperacional = receitaLiquida - totalImplantacao - totalFixas;

  // Criar entrada virtual para reembolsos automáticos
  const enrichedEntriesByCategory = {
    ...entriesByCategory,
    deducoes: [
      ...(deducoesAuto > 0
        ? [{
            id: "auto-refunds",
            organization_id: orgId ?? "",
            pdv_id: null,
            category: "deducoes",
            description: "Reembolsos / Cancelamentos",
            amount: deducoesAuto,
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
    faturamentoBruto: faturamento,
    deducoes: deducoesTotal,
    receitaLiquida,
    despesasImplantacao: totalImplantacao,
    despesasFixas: totalFixas,
    resultadoOperacional,
  };

  return {
    dre,
    entriesByCategory: enrichedEntriesByCategory,
    isLoading: salesQuery.isLoading || entriesLoading,
    error: salesQuery.error,
  };
}
