import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { useActiveOrg } from "@/contexts/ActiveOrgContext";
import { useDREConfig } from "./useDREConfig";
import { startOfMonth, subMonths, format } from "date-fns";

export interface MonthSummary {
  month: Date;
  label: string;
  receita: number;
  custos: number;
  resultado: number;
  margem: number;
}

interface UseMonthlyDRESummaryOptions {
  pdvId?: string | null;
  months?: number;
}

export function useMonthlyDRESummary({ pdvId, months = 6 }: UseMonthlyDRESummaryOptions = {}) {
  const { profile } = useProfile();
  const { activeOrgId } = useActiveOrg();
  const isAllOrgs = activeOrgId === "all";
  const orgId = isAllOrgs ? null : (activeOrgId ?? profile?.organization_id);

  const { unitCost, stoneRate, taxRate } = useDREConfig({ pdvId });

  // Generate the last N months
  const now = new Date();
  const monthList = Array.from({ length: months }, (_, i) => startOfMonth(subMonths(now, i)));
  const currentYear = now.getFullYear();
  const prevYear = currentYear - 1;

  const query = useQuery({
    queryKey: ["monthly-dre-summary", orgId, pdvId, months, unitCost, stoneRate, taxRate],
    queryFn: async () => {
      // Get PDV IDs
      let pdvQuery = supabase.from("pdvs").select("id");
      if (orgId) pdvQuery = pdvQuery.eq("organization_id", orgId);
      const { data: pdvs, error: pdvError } = await pdvQuery;
      if (pdvError) throw pdvError;

      const pdvIds = pdvId ? [pdvId] : pdvs.map((p) => p.id);
      if (pdvIds.length === 0) return [];

      // Fetch sales data for current and previous year using RPC
      const yearsToFetch = currentYear === prevYear ? [currentYear] : [prevYear, currentYear];
      const salesByMonth = new Map<string, { faturamento: number; deducoes: number; sales_count: number; card_revenue: number }>();

      await Promise.all(
        yearsToFetch.map(async (year) => {
          const { data, error } = await (supabase as unknown as any).rpc("get_annual_dre_summary", {
            p_pdv_ids: pdvIds,
            p_year: year,
          });
          if (error) throw error;
          for (const row of data ?? []) {
            salesByMonth.set(row.month_start, {
              faturamento: Number(row.faturamento) || 0,
              deducoes: Number(row.deducoes) || 0,
              sales_count: Number(row.sales_count) || 0,
              card_revenue: Number(row.card_revenue) || 0,
            });
          }
        })
      );

      // Fetch financial entries for all relevant months
      const monthStrs = monthList.map((m) => format(m, "yyyy-MM-dd"));
      let entriesQuery = supabase
        .from("financial_entries")
        .select("*")
        .in("reference_month", monthStrs);

      if (orgId) entriesQuery = entriesQuery.eq("organization_id", orgId);
      if (pdvId) entriesQuery = entriesQuery.or(`pdv_id.eq.${pdvId},pdv_id.is.null`);

      const { data: entries, error: entriesError } = await entriesQuery;
      if (entriesError) throw entriesError;

      // Group entries by month
      const entriesByMonth = new Map<string, typeof entries>();
      for (const entry of entries ?? []) {
        const key = entry.reference_month;
        if (!entriesByMonth.has(key)) entriesByMonth.set(key, []);
        entriesByMonth.get(key)!.push(entry);
      }

      // Build summary for each month
      return monthList.map((month) => {
        const monthStr = format(month, "yyyy-MM-dd");
        const sales = salesByMonth.get(monthStr) ?? { faturamento: 0, deducoes: 0, sales_count: 0, card_revenue: 0 };
        const monthEntries = entriesByMonth.get(monthStr) ?? [];

        const totalFixas = monthEntries.filter((e) => e.category === "fixas").reduce((s, e) => s + Number(e.amount), 0);
        const totalDeducoes = monthEntries.filter((e) => e.category === "deducoes").reduce((s, e) => s + Number(e.amount), 0);
        const totalImplantacao = monthEntries.filter((e) => e.category === "implantacao").reduce((s, e) => s + Number(e.amount), 0);

        const receita = sales.faturamento;
        const impostos = receita * taxRate;
        const reembolsos = sales.deducoes + totalDeducoes;
        const receitaLiquida = receita - impostos - reembolsos;
        const cmv = sales.sales_count * unitCost;
        const taxasStone = sales.card_revenue * stoneRate;
        const lucroBruto = receitaLiquida - cmv - taxasStone;
        const resultado = lucroBruto - totalFixas - totalImplantacao;
        const custos = impostos + reembolsos + cmv + taxasStone + totalFixas + totalImplantacao;
        const margem = receitaLiquida > 0 ? (resultado / receitaLiquida) * 100 : 0;

        return {
          month,
          label: format(month, "MMM/yy"),
          receita,
          custos,
          resultado,
          margem,
        } satisfies MonthSummary;
      });
    },
    enabled: !!orgId || isAllOrgs,
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
