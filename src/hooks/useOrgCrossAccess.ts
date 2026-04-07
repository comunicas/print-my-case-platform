import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import { useProfile } from "@/hooks/useProfile";

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

const POSTGREST_RESERVED_CHARS_MAP: Record<string, string> = {
  "\\": "\\\\",
  ",": "\\,",
  "(": "\\(",
  ")": "\\)",
  "%": "\\%",
  "_": "\\_",
  '"': '\\"',
};

export function escapePostgrestOrValue(value: string): string {
  return value.replace(/[\\,()%_"]/g, (char) => POSTGREST_RESERVED_CHARS_MAP[char] ?? char);
}

function hasControlCharacters(value: string): boolean {
  return [...value].some((char) => {
    const code = char.charCodeAt(0);
    return code <= 31 || code === 127;
  });
}

export function sanitizePostgrestSearchTerm(term: string): string | null {
  const trimmedTerm = term.trim();
  if (trimmedTerm.length < 2) return null;
  if (hasControlCharacters(trimmedTerm)) return null;

  const escapedTerm = escapePostgrestOrValue(trimmedTerm);
  return escapedTerm.length > 0 ? escapedTerm : null;
}

// ── Audit log helper ──────────────────────────────────────────
async function logCrossOrgAudit(params: {
  eventType: "cross_org_access_granted" | "cross_org_access_revoked" | "cross_org_access_updated";
  actorId: string;
  actorEmail: string;
  targetEmail: string;
  organizationId: string;
  organizationName: string;
  metadata: Record<string, unknown>;
}) {
  await supabase.from("audit_logs").insert({
    event_type: params.eventType,
    actor_id: params.actorId,
    actor_email: params.actorEmail,
    target_email: params.targetEmail,
    organization_id: params.organizationId,
    organization_name: params.organizationName,
    metadata: params.metadata,
    success: true,
  });
}

export function useOrgCrossAccess(organizationId: string, open: boolean) {
  const queryClient = useQueryClient();
  const { profile } = useProfile();

  // ── Cross-org users query ─────────────────────────────────
  const crossUsersQuery = useQuery({
    queryKey: ["org-cross-access", organizationId],
    queryFn: async () => {
      const { data: accessRecords, error: accessError } = await supabase
        .from("user_org_access")
        .select("id, user_id, access_level")
        .eq("organization_id", organizationId);

      if (accessError) throw accessError;
      if (!accessRecords || accessRecords.length === 0) return [] as CrossOrgUser[];

      const userIds = accessRecords.map((r) => r.user_id);

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name, email, organization_id")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      const orgIds = [...new Set(profiles?.map((p) => p.organization_id).filter(Boolean) as string[])];
      let orgMap = new Map<string, string>();
      if (orgIds.length > 0) {
        const { data: orgs } = await supabase.from("organizations").select("id, name").in("id", orgIds);
        if (orgs) orgMap = new Map(orgs.map((o) => [o.id, o.name]));
      }

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      return accessRecords.map((r) => {
        const p = profileMap.get(r.user_id);
        return {
          id: r.id,
          user_id: r.user_id,
          access_level: r.access_level,
          name: p?.name || "—",
          email: p?.email || "—",
          org_name: p?.organization_id ? orgMap.get(p.organization_id) || "—" : "—",
        };
      }) as CrossOrgUser[];
    },
    enabled: open && !!organizationId,
  });

  // ── Org name for audit logs ───────────────────────────────
  const orgName = useQuery({
    queryKey: ["org-name-for-audit", organizationId],
    queryFn: async () => {
      const { data } = await supabase.from("organizations").select("name").eq("id", organizationId).maybeSingle();
      return data?.name ?? "—";
    },
    enabled: open && !!organizationId,
    staleTime: 60 * 60 * 1000,
  });

  // ── Remove access ─────────────────────────────────────────
  const removeAccessMutation = useMutation({
    mutationFn: async (accessId: string) => {
      // Grab target info before deleting
      const target = crossUsersQuery.data?.find((u) => u.id === accessId);
      const { error } = await supabase.from("user_org_access").delete().eq("id", accessId);
      if (error) throw error;
      return target;
    },
    onSuccess: (target) => {
      toast.success("Acesso removido com sucesso");
      queryClient.invalidateQueries({ queryKey: ["org-cross-access", organizationId] });
      if (profile && target) {
        logCrossOrgAudit({
          eventType: "cross_org_access_revoked",
          actorId: profile.id,
          actorEmail: profile.email,
          targetEmail: target.email,
          organizationId,
          organizationName: orgName.data ?? "—",
          metadata: { user_id: target.user_id, user_name: target.name, access_level: target.access_level },
        });
      }
    },
    onError: (error: Error) => {
      toast.error("Erro ao remover acesso", { description: error.message });
    },
  });

  // ── Update access level ───────────────────────────────────
  const updateAccessMutation = useMutation({
    mutationFn: async ({ accessId, accessLevel }: { accessId: string; accessLevel: string }) => {
      const target = crossUsersQuery.data?.find((u) => u.id === accessId);
      const { error } = await supabase
        .from("user_org_access")
        .update({ access_level: accessLevel })
        .eq("id", accessId);
      if (error) throw error;
      return { target, accessLevel };
    },
    onSuccess: ({ target, accessLevel }) => {
      toast.success("Nível de acesso atualizado");
      queryClient.invalidateQueries({ queryKey: ["org-cross-access", organizationId] });
      if (profile && target) {
        logCrossOrgAudit({
          eventType: "cross_org_access_updated",
          actorId: profile.id,
          actorEmail: profile.email,
          targetEmail: target.email,
          organizationId,
          organizationName: orgName.data ?? "—",
          metadata: {
            user_id: target.user_id,
            user_name: target.name,
            previous_level: target.access_level,
            new_level: accessLevel,
          },
        });
      }
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
      const sanitizedSearch = sanitizePostgrestSearchTerm(debouncedSearch);
      if (!sanitizedSearch) return [] as SearchableUser[];

      const { data: existing } = await supabase
        .from("user_org_access")
        .select("user_id")
        .eq("organization_id", organizationId);

      const excludeIds = existing?.map((e) => e.user_id) || [];

      const query = supabase
        .from("profiles")
        .select("id, name, email")
        .neq("organization_id", organizationId)
        .or(`email.ilike.%${sanitizedSearch}%,name.ilike.%${sanitizedSearch}%`)
        .limit(10);

      const { data, error } = await query;
      if (error) throw error;

      const excludeSet = new Set(excludeIds);
      return (data || []).filter((u) => !excludeSet.has(u.id)) as SearchableUser[];
    },
    enabled: showAddAccess && debouncedSearch.length >= 2,
  });

  const addAccessMutation = useMutation({
    mutationFn: async ({ userId, accessLevel }: { userId: string; accessLevel: string }) => {
      const targetUser = searchUsersQuery.data?.find((u) => u.id === userId);
      const { error } = await supabase.from("user_org_access").insert({
        user_id: userId,
        organization_id: organizationId,
        access_level: accessLevel,
      });
      if (error) throw error;
      return targetUser;
    },
    onSuccess: (targetUser) => {
      toast.success("Acesso concedido com sucesso");
      queryClient.invalidateQueries({ queryKey: ["org-cross-access", organizationId] });
      queryClient.invalidateQueries({ queryKey: ["org-cross-search-users", organizationId] });
      setShowAddAccess(false);
      setSearchTerm("");
      if (profile && targetUser) {
        logCrossOrgAudit({
          eventType: "cross_org_access_granted",
          actorId: profile.id,
          actorEmail: profile.email,
          targetEmail: targetUser.email,
          organizationId,
          organizationName: orgName.data ?? "—",
          metadata: {
            user_id: targetUser.id,
            user_name: targetUser.name,
            access_level: selectedAccessLevel,
          },
        });
      }
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
