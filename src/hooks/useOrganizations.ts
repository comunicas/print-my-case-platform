import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

export interface Organization {
  id: string;
  name: string;
  owner_id: string | null;
}

export function useOrganizations() {
  const { role } = useProfile();
  const isSuperAdmin = role === "super_admin";

  const query = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, owner_id")
        .order("name");

      if (error) throw error;
      return data as Organization[];
    },
    enabled: isSuperAdmin,
    staleTime: 2 * 60 * 1000, // 2 minutes (reduced from 10)
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    organizations: query.data ?? [],
    isLoading: query.isLoading,
    isSuperAdmin,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}
