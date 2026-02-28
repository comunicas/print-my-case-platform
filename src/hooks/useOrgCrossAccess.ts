import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";

export interface CrossOrgUser {
  id: string; // user_org_access.id
  user_id: string;
  access_level: string;
  name: string;
  email: string;
  org_name: string;
}

export interface SearchableUser {
  id: string;
  name: string;
  email: string;
}

export function useOrgCrossAccess(organizationId: string, open: boolean) {
  const queryClient = useQueryClient();

  // ── Cross-org users query ─────────────────────────────────
  const crossUsersQuery = useQuery({
    queryKey: ["org-cross-access", organizationId],
    queryFn: async () => {
      // Get user_org_access records for this org
      const { data: accessRecords, error: accessError } = await supabase
        .from("user_org_access")
        .select("id, user_id, access_level")
        .eq("organization_id", organizationId);

      if (accessError) throw accessError;
      if (!accessRecords || accessRecords.length === 0) return [] as CrossOrgUser[];

      const userIds = accessRecords.map((r) => r.user_id);

      // Get profiles for those users
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name, email, organization_id")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Get org names for origin orgs
      const orgIds = [...new Set(profiles?.map((p) => p.organization_id).filter(Boolean) as string[])];
      let orgMap = new Map<string, string>();
      if (orgIds.length > 0) {
        const { data: orgs } = await supabase
          .from("organizations")
          .select("id, name")
          .in("id", orgIds);
        if (orgs) orgMap = new Map(orgs.map((o) => [o.id, o.name]));
      }

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      return accessRecords.map((r) => {
        const profile = profileMap.get(r.user_id);
        return {
          id: r.id,
          user_id: r.user_id,
          access_level: r.access_level,
          name: profile?.name || "—",
          email: profile?.email || "—",
          org_name: profile?.organization_id ? orgMap.get(profile.organization_id) || "—" : "—",
        };
      }) as CrossOrgUser[];
    },
    enabled: open && !!organizationId,
  });

  // ── Remove access ─────────────────────────────────────────
  const removeAccessMutation = useMutation({
    mutationFn: async (accessId: string) => {
      const { error } = await supabase.from("user_org_access").delete().eq("id", accessId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Acesso removido com sucesso");
      queryClient.invalidateQueries({ queryKey: ["org-cross-access", organizationId] });
    },
    onError: (error: Error) => {
      toast.error("Erro ao remover acesso", { description: error.message });
    },
  });

  // ── Update access level ───────────────────────────────────
  const updateAccessMutation = useMutation({
    mutationFn: async ({ accessId, accessLevel }: { accessId: string; accessLevel: string }) => {
      const { error } = await supabase
        .from("user_org_access")
        .update({ access_level: accessLevel })
        .eq("id", accessId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Nível de acesso atualizado");
      queryClient.invalidateQueries({ queryKey: ["org-cross-access", organizationId] });
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar acesso", { description: error.message });
    },
  });

  // ── Add access dialog state ───────────────────────────────
  const [showAddAccess, setShowAddAccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<string>("viewer");
  const debouncedSearch = useDebounce(searchTerm, 300);

  const searchUsersQuery = useQuery({
    queryKey: ["org-cross-search-users", organizationId, debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return [] as SearchableUser[];

      // Get existing access user IDs to exclude
      const { data: existing } = await supabase
        .from("user_org_access")
        .select("user_id")
        .eq("organization_id", organizationId);

      const excludeIds = existing?.map((e) => e.user_id) || [];

      // Search profiles not in this org
      let query = supabase
        .from("profiles")
        .select("id, name, email")
        .neq("organization_id", organizationId)
        .or(`email.ilike.%${debouncedSearch}%,name.ilike.%${debouncedSearch}%`)
        .limit(10);

      if (excludeIds.length > 0) {
        // Filter out users who already have access — done client-side since .not('id', 'in', ...) has limits
      }

      const { data, error } = await query;
      if (error) throw error;

      // Client-side filter for existing access
      const excludeSet = new Set(excludeIds);
      return (data || []).filter((u) => !excludeSet.has(u.id)) as SearchableUser[];
    },
    enabled: showAddAccess && debouncedSearch.length >= 2,
  });

  const addAccessMutation = useMutation({
    mutationFn: async ({ userId, accessLevel }: { userId: string; accessLevel: string }) => {
      const { error } = await supabase.from("user_org_access").insert({
        user_id: userId,
        organization_id: organizationId,
        access_level: accessLevel,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Acesso concedido com sucesso");
      queryClient.invalidateQueries({ queryKey: ["org-cross-access", organizationId] });
      queryClient.invalidateQueries({ queryKey: ["org-cross-search-users", organizationId] });
      setShowAddAccess(false);
      setSearchTerm("");
    },
    onError: (error: Error) => {
      toast.error("Erro ao conceder acesso", { description: error.message });
    },
  });

  const handleOpenAddAccess = () => {
    setShowAddAccess(true);
    setSearchTerm("");
    setSelectedAccessLevel("viewer");
  };

  const handleCloseAddAccess = (open: boolean) => {
    if (!open) {
      setShowAddAccess(false);
      setSearchTerm("");
    }
  };

  return {
    crossUsers: crossUsersQuery.data,
    crossUsersLoading: crossUsersQuery.isLoading,
    removeAccess: removeAccessMutation.mutate,
    isRemovingAccess: removeAccessMutation.isPending,
    updateAccessLevel: updateAccessMutation.mutate,
    isUpdatingAccess: updateAccessMutation.isPending,
    addAccess: {
      isOpen: showAddAccess,
      open: handleOpenAddAccess,
      close: handleCloseAddAccess,
      searchTerm,
      setSearchTerm,
      accessLevel: selectedAccessLevel,
      setAccessLevel: setSelectedAccessLevel,
      results: searchUsersQuery.data || [],
      isSearching: searchUsersQuery.isFetching,
      grant: (userId: string) =>
        addAccessMutation.mutate({ userId, accessLevel: selectedAccessLevel }),
      isGranting: addAccessMutation.isPending,
    },
  };
}
