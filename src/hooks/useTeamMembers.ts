import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { useToast } from "@/hooks/use-toast";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  status: "active" | "pending" | "inactive";
  role: "super_admin" | "org_admin" | "operator" | "viewer";
  created_at: string;
}

export function useTeamMembers() {
  const { profile, isAdmin } = useProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const teamQuery = useQuery({
    queryKey: ["team-members", profile?.organization_id],
    queryFn: async () => {
      // First get profiles in the organization
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("name");

      if (profilesError) throw profilesError;

      // Then get roles for each profile
      const profileIds = profiles.map(p => p.id);
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*")
        .in("user_id", profileIds);

      if (rolesError) throw rolesError;

      // Combine profiles with roles
      const members: TeamMember[] = profiles.map(profile => {
        const userRole = roles.find(r => r.user_id === profile.id);
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
          status: profile.status as "active" | "pending" | "inactive",
          role: (userRole?.role as TeamMember["role"]) ?? "viewer",
          created_at: profile.created_at,
        };
      });

      return members;
    },
    enabled: !!profile?.organization_id,
  });

  const updateMemberRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: TeamMember["role"] }) => {
      if (!isAdmin) throw new Error("Permissão negada");
      
      // Update or insert role
      const { error } = await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role }, { onConflict: "user_id,role" });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast({
        title: "Função atualizada",
        description: "A função do membro foi alterada.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMemberStatus = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: TeamMember["status"] }) => {
      if (!isAdmin) throw new Error("Permissão negada");
      
      const { error } = await supabase
        .from("profiles")
        .update({ status })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast({
        title: "Status atualizado",
        description: "O status do membro foi alterado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    members: teamQuery.data ?? [],
    isLoading: teamQuery.isLoading,
    error: teamQuery.error,
    updateMemberRole,
    updateMemberStatus,
  };
}
