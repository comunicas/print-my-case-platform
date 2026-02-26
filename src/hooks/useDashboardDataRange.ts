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
      // Determine which PDVs to query — mirrors useDashboard logic
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

      // Single RPC call instead of 2 separate queries
      const { data, error } = await supabase.rpc("get_sales_date_range", {
        p_pdv_ids: pdvIds,
      });

      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : data;
      if (!row?.min_date || !row?.max_date) return undefined;

      return {
        min: startOfDay(new Date(row.min_date)),
        max: endOfDay(new Date(row.max_date)),
      };
    },
    enabled: !!profile?.id || isSuperAdmin,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return {
    dataRange: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
