import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

export interface AccessibleOrganization {
  id: string;
  name: string;
  accessLevel: "owner" | "viewer" | "editor";
}

/**
 * Retorna todas as organizações que o usuário pode acessar:
 * - Sua própria organização (owner)
 * - Organizações com acesso via user_org_access (viewer/editor)
 */
export function useUserOrganizations() {
  const { profile } = useProfile();

  const query = useQuery({
    queryKey: ["user-organizations", profile?.id, profile?.organization_id],
    queryFn: async (): Promise<AccessibleOrganization[]> => {
      if (!profile?.id) return [];

      const orgs: AccessibleOrganization[] = [];

      // 1. Fetch user's own organization
      if (profile.organization_id) {
        const { data: ownOrg } = await supabase
          .from("organizations")
          .select("id, name")
          .eq("id", profile.organization_id)
          .maybeSingle();

        if (ownOrg) {
          orgs.push({ id: ownOrg.id, name: ownOrg.name, accessLevel: "owner" });
        }
      }

      // 2. Fetch cross-org access grants
      const { data: accessGrants } = await supabase
        .from("user_org_access")
        .select("organization_id, access_level")
        .eq("user_id", profile.id);

      if (accessGrants && accessGrants.length > 0) {
        const orgIds = accessGrants.map(g => g.organization_id);
        const { data: crossOrgs } = await supabase
          .from("organizations")
          .select("id, name")
          .in("id", orgIds);

        if (crossOrgs) {
          for (const org of crossOrgs) {
            const grant = accessGrants.find(g => g.organization_id === org.id);
            orgs.push({
              id: org.id,
              name: org.name,
              accessLevel: (grant?.access_level as "viewer" | "editor") || "viewer",
            });
          }
        }
      }

      return orgs;
    },
    enabled: !!profile?.id,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  return {
    organizations: query.data ?? [],
    hasMultipleOrgs: (query.data?.length ?? 0) > 1,
    isLoading: query.isLoading,
  };
}
