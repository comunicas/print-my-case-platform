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
  const orgId = activeOrgId ?? profile?.organization_id;

  const monthStart = startOfMonth(referenceMonth);
  const monthEnd = endOfMonth(referenceMonth);
  const startStr = format(monthStart, "yyyy-MM-dd'T'00:00:00");
  const endStr = format(monthEnd, "yyyy-MM-dd'T'23:59:59");

  // Query de vendas do mês
  const salesQuery = useQuery({
    queryKey: ["dre-sales", orgId, startStr, endStr, pdvId],
    queryFn: async () => {
      // Buscar PDVs da org
      let pdvQuery = supabase
        .from("pdvs")
        .select("id")
        .eq("organization_id", orgId!);

      const { data: pdvs, error: pdvError } = await pdvQuery;
      if (pdvError) throw pdvError;

      const pdvIds = pdvId ? [pdvId] : pdvs.map((p) => p.id);
      if (pdvIds.length === 0) return { faturamento: 0, deducoes: 0 };

      const { data: sales, error } = await supabase
        .from("sales_records")
        .select("amount, refund_amount, status")
        .in("pdv_id", pdvIds)
        .gte("payment_date", startStr)
        .lte("payment_date", endStr);

      if (error) throw error;

      let faturamento = 0;
      let deducoes = 0;

      for (const sale of sales ?? []) {
        faturamento += Number(sale.amount) || 0;
        deducoes += Number(sale.refund_amount) || 0;
      }

      return { faturamento, deducoes };
    },
    enabled: !!orgId,
  });

  // Dados de despesas manuais
  const { totalDeducoes, totalImplantacao, totalFixas, entriesByCategory, isLoading: entriesLoading } = useFinancialEntries({
    referenceMonth,
  });

  const faturamento = salesQuery.data?.faturamento ?? 0;
  const deducoesAuto = salesQuery.data?.deducoes ?? 0;
  const deducoesTotal = deducoesAuto + totalDeducoes;
  const receitaLiquida = faturamento - deducoesTotal;
  const resultadoOperacional = receitaLiquida - totalImplantacao - totalFixas;

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
    entriesByCategory,
    isLoading: salesQuery.isLoading || entriesLoading,
    error: salesQuery.error,
  };
}
