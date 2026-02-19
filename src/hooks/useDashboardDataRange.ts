import { useQuery } from "@tanstack/react-query";
import { startOfDay, endOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { useUserAllowedPDVs } from "./useUserAllowedPDVs";

export interface DashboardDataRange {
  min: Date;
  max: Date;
}

interface UseDashboardDataRangeParams {
  selectedOrganizationId?: string | "all";
  selectedPdvId?: string | "all";
}

/**
 * Hook leve que busca o intervalo real de datas disponíveis em sales_records,
 * respeitando os mesmos filtros de organização/PDV que o useDashboard.
 * Usado para alimentar o DateRangeFilter com o dataRange real.
 */
export function useDashboardDataRange({
  selectedOrganizationId,
  selectedPdvId,
}: UseDashboardDataRangeParams = {}) {
  const { profile, role } = useProfile();
  const { allowedPdvIds: userAllowedPdvIds } = useUserAllowedPDVs();
  const isSuperAdmin = role === "super_admin";

  const query = useQuery({
    queryKey: [
      "dashboard-data-range",
      profile?.organization_id,
      selectedOrganizationId,
      selectedPdvId,
      isSuperAdmin,
      userAllowedPdvIds,
    ],
    queryFn: async (): Promise<DashboardDataRange | undefined> => {
      // Determine which PDVs to query — mirrors useDashboard logic exactly
      let pdvIds: string[] | null = null;

      if (selectedPdvId && selectedPdvId !== "all") {
        pdvIds = [selectedPdvId];
      } else if (userAllowedPdvIds !== null) {
        pdvIds = userAllowedPdvIds;
      } else if (!isSuperAdmin || (selectedOrganizationId && selectedOrganizationId !== "all")) {
        const orgIdToFilter =
          selectedOrganizationId && selectedOrganizationId !== "all"
            ? selectedOrganizationId
            : profile?.organization_id;

        if (orgIdToFilter) {
          const { data: pdvs } = await supabase
            .from("pdvs")
            .select("id")
            .eq("organization_id", orgIdToFilter);
          pdvIds = pdvs?.map((p) => p.id) || [];
        }
      }

      // Build base query for min and max payment_date
      const buildQuery = () => {
        let q = supabase
          .from("sales_records")
          .select("payment_date")
          .not("payment_date", "is", null);

        if (pdvIds !== null) {
          const filterIds = pdvIds.length > 0 ? pdvIds : ["no-match"];
          q = q.in("pdv_id", filterIds);
        }

        return q;
      };

      const [minResult, maxResult] = await Promise.all([
        buildQuery().order("payment_date", { ascending: true }).limit(1).maybeSingle(),
        buildQuery().order("payment_date", { ascending: false }).limit(1).maybeSingle(),
      ]);

      if (minResult.error) throw minResult.error;
      if (maxResult.error) throw maxResult.error;

      if (!minResult.data?.payment_date || !maxResult.data?.payment_date) {
        return undefined;
      }

      return {
        min: startOfDay(new Date(minResult.data.payment_date)),
        max: endOfDay(new Date(maxResult.data.payment_date)),
      };
    },
    enabled: !!profile?.id || isSuperAdmin,
    staleTime: 10 * 60 * 1000, // 10 minutos — dados históricos mudam raramente
    gcTime: 30 * 60 * 1000,
  });

  return {
    dataRange: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
