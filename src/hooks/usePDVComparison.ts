import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { useActiveOrg } from "@/contexts/ActiveOrgContext";
import { useDREConfig } from "./useDREConfig";
import { usePDVs } from "./usePDVs";
import { startOfMonth, endOfMonth, format } from "date-fns";

export interface PDVComparisonData {
  pdvId: string;
  pdvName: string;
  receita: number;
  receitaLiquida: number;
  resultado: number;
  margem: number;
  transacoes: number;
}


interface DRESalesSummaryRow {
  faturamento: number | string | null;
  deducoes: number | string | null;
  sales_count: number | string | null;
  card_revenue: number | string | null;
}

interface FinancialEntryRow {
  category: string;
  amount: number | string | null;
}

export function usePDVComparison() {
  const { profile } = useProfile();
  const { activeOrgId } = useActiveOrg();
  const isAllOrgs = activeOrgId === "all";
  const orgId = isAllOrgs ? null : (activeOrgId ?? profile?.organization_id);
  const { pdvs } = usePDVs();
  const { unitCost, stoneRate, taxRate } = useDREConfig();

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const startStr = format(monthStart, "yyyy-MM-dd'T'00:00:00");
  const endStr = format(monthEnd, "yyyy-MM-dd'T'23:59:59");
  const monthStr = format(monthStart, "yyyy-MM-dd");

  const activePdvs = pdvs.filter((p) => p.status === "active");

  const query = useQuery({
    queryKey: ["pdv-comparison", orgId, monthStr, unitCost, stoneRate, taxRate],
    queryFn: async () => {
      if (activePdvs.length === 0) return [];

      const pdvCount = activePdvs.length;

      // Fetch org-wide entries (pdv_id IS NULL) once
      let orgEntriesQuery = supabase
        .from("financial_entries")
        .select("*")
        .eq("reference_month", monthStr)
        .is("pdv_id", null);
      if (orgId) orgEntriesQuery = orgEntriesQuery.eq("organization_id", orgId);
      const { data: orgEntries } = await orgEntriesQuery;

      const orgFixas = (orgEntries ?? []).filter((e) => e.category === "fixas").reduce((s, e) => s + Number(e.amount), 0);
      const orgDeducoes = (orgEntries ?? []).filter((e) => e.category === "deducoes").reduce((s, e) => s + Number(e.amount), 0);
      const orgImplantacao = (orgEntries ?? []).filter((e) => e.category === "implantacao").reduce((s, e) => s + Number(e.amount), 0);

      // Distribute org-wide expenses evenly across PDVs
      const sharedFixas = orgFixas / pdvCount;
      const sharedDeducoes = orgDeducoes / pdvCount;
      const sharedImplantacao = orgImplantacao / pdvCount;

      const results = await Promise.all(
        activePdvs.map(async (pdv) => {
          const [salesResult, pdvEntriesResult] = await Promise.all([
            supabase.rpc("get_dre_sales_summary", {
              p_pdv_ids: [pdv.id],
              p_start_date: startStr,
              p_end_date: endStr,
            }),
            // Only fetch PDV-specific entries (not null)
            supabase
              .from("financial_entries")
              .select("*")
              .eq("reference_month", monthStr)
              .eq("pdv_id", pdv.id),
          ]);

          const sales = (salesResult.data?.[0] ?? { faturamento: 0, deducoes: 0, sales_count: 0, card_revenue: 0 }) as DRESalesSummaryRow;
          const pdvEntries = (pdvEntriesResult.data ?? []) as FinancialEntryRow[];

          const receita = Number(sales.faturamento) || 0;
          const impostos = receita * taxRate;
          const pdvDeducoes = pdvEntries.filter((e) => e.category === "deducoes").reduce((s, e) => s + Number(e.amount), 0);
          const totalDeducoes = pdvDeducoes + sharedDeducoes;
          const reembolsos = (Number(sales.deducoes) || 0) + totalDeducoes;
          const receitaLiquida = receita - impostos - reembolsos;
          const cmv = (Number(sales.sales_count) || 0) * unitCost;
          const taxasStone = (Number(sales.card_revenue) || 0) * stoneRate;
          const pdvFixas = pdvEntries.filter((e) => e.category === "fixas").reduce((s, e) => s + Number(e.amount), 0);
          const pdvImplantacao = pdvEntries.filter((e) => e.category === "implantacao").reduce((s, e) => s + Number(e.amount), 0);
          const totalFixas = pdvFixas + sharedFixas;
          const totalImplantacao = pdvImplantacao + sharedImplantacao;
          const resultado = receitaLiquida - cmv - taxasStone - totalFixas - totalImplantacao;
          const margem = receitaLiquida > 0 ? (resultado / receitaLiquida) * 100 : 0;

          return {
            pdvId: pdv.id,
            pdvName: pdv.name,
            receita,
            receitaLiquida,
            resultado,
            margem,
            transacoes: Number(sales.sales_count) || 0,
          } satisfies PDVComparisonData;
        })
      );

      return results.sort((a, b) => b.receita - a.receita);
    },
    enabled: (!!orgId || isAllOrgs) && activePdvs.length > 1,
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    showComparison: activePdvs.length > 1,
  };
}
