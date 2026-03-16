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

      // Fetch sales and entries for all PDVs in parallel
      const results = await Promise.all(
        activePdvs.map(async (pdv) => {
          const [salesResult, entriesResult] = await Promise.all([
            (supabase as unknown as any).rpc("get_dre_sales_summary", {
              p_pdv_ids: [pdv.id],
              p_start_date: startStr,
              p_end_date: endStr,
            }),
            supabase
              .from("financial_entries")
              .select("*")
              .eq("reference_month", monthStr)
              .or(`pdv_id.eq.${pdv.id},pdv_id.is.null`),
          ]);

          const sales = salesResult.data?.[0] ?? { faturamento: 0, deducoes: 0, sales_count: 0, card_revenue: 0 };
          const entries = entriesResult.data ?? [];

          const receita = Number(sales.faturamento) || 0;
          const impostos = receita * taxRate;
          const totalDeducoes = entries.filter((e: any) => e.category === "deducoes").reduce((s: number, e: any) => s + Number(e.amount), 0);
          const reembolsos = (Number(sales.deducoes) || 0) + totalDeducoes;
          const receitaLiquida = receita - impostos - reembolsos;
          const cmv = (Number(sales.sales_count) || 0) * unitCost;
          const taxasStone = (Number(sales.card_revenue) || 0) * stoneRate;
          const totalFixas = entries.filter((e: any) => e.category === "fixas").reduce((s: number, e: any) => s + Number(e.amount), 0);
          const totalImplantacao = entries.filter((e: any) => e.category === "implantacao").reduce((s: number, e: any) => s + Number(e.amount), 0);
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
