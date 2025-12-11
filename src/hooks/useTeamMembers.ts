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
          created_at: profile.created_at ?? new Date().toISOString(),
        };
      });

      return members;
    },
    enabled: !!profile?.organization_id,
  });

  const updateMember = useMutation({
    mutationFn: async (data: { 
      userId: string; 
      name: string; 
      role: TeamMember["role"]; 
      status: TeamMember["status"];
    }) => {
      if (!isAdmin) throw new Error("Permissão negada");
      
      // Update profile (name and status)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ 
          name: data.name, 
          status: data.status,
          updated_at: new Date().toISOString() 
        })
        .eq("id", data.userId);
      
      if (profileError) throw profileError;
      
      // First delete existing role then insert new one
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId);
      
      if (deleteError) throw deleteError;
      
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({ 
          user_id: data.userId, 
          role: data.role 
        });
      
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast({
        title: "Membro atualizado",
        description: "Alterações salvas com sucesso.",
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

  const removeMember = useMutation({
    mutationFn: async (userId: string) => {
      if (!isAdmin) throw new Error("Permissão negada");
      
      // Remove from organization (don't delete the user)
      const { error } = await supabase
        .from("profiles")
        .update({ 
          organization_id: null, 
          status: "inactive",
          updated_at: new Date().toISOString()
        })
        .eq("id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast({
        title: "Membro removido",
        description: "O membro foi removido da organização.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    members: teamQuery.data ?? [],
    isLoading: teamQuery.isLoading,
    error: teamQuery.error,
    isAdmin,
    updateMember,
    removeMember,
  };
}
