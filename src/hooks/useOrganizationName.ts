import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

export function useOrganizationName() {
  const { profile } = useProfile();

  return useQuery({
    queryKey: ["organization-name", profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return null;
      
      const { data, error } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", profile.organization_id)
        .maybeSingle();

      if (error) return null;
      return data?.name || null;
    },
    enabled: !!profile?.organization_id,
  });
}
