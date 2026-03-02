import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { useActiveOrg } from "@/contexts/ActiveOrgContext";

interface UseFinancialDescriptionsOptions {
  category: string;
}

export function useFinancialDescriptions({ category }: UseFinancialDescriptionsOptions) {
  const { profile } = useProfile();
  const { activeOrgId } = useActiveOrg();

  const isAllOrgs = activeOrgId === "all";
  const orgId = isAllOrgs ? null : (activeOrgId ?? profile?.organization_id);

  return useQuery({
    queryKey: ["financial-descriptions", orgId, category],
    queryFn: async () => {
      let query = supabase
        .from("financial_entries")
        .select("description")
        .eq("category", category);

      if (orgId) {
        query = query.eq("organization_id", orgId);
      }

      query = query.order("description");

      const { data, error } = await query;
      if (error) throw error;

      // Extract unique descriptions
      const unique = [...new Set(data.map((d) => d.description))];
      return unique;
    },
    enabled: !!category && (!!orgId || isAllOrgs),
  });
}
