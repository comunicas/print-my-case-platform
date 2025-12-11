import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { useToast } from "@/hooks/use-toast";
import { CreateUserFormData } from "@/lib/schemas/user";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  status: "active" | "pending" | "inactive";
  role: "super_admin" | "org_admin" | "operator" | "viewer";
  created_at: string;
  organization_name?: string;
}

export function useTeamMembers() {
  const { profile, role, isAdmin } = useProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const isSuperAdmin = role === "super_admin";

  const teamQuery = useQuery({
    queryKey: ["team-members", profile?.organization_id, isSuperAdmin],
    queryFn: async () => {
      // Super admin sees all users, others see only their organization
      let profilesQuery = supabase
        .from("profiles")
        .select("*, organizations(name)")
        .order("name");
      
      // Non-super-admin only see their organization members
      if (!isSuperAdmin && profile?.organization_id) {
        profilesQuery = profilesQuery.eq("organization_id", profile.organization_id);
      }

      const { data: profiles, error: profilesError } = await profilesQuery;

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
        const orgData = profile.organizations as { name: string } | null;
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
          status: profile.status as "active" | "pending" | "inactive",
          role: (userRole?.role as TeamMember["role"]) ?? "viewer",
          created_at: profile.created_at ?? new Date().toISOString(),
          organization_name: orgData?.name,
        };
      });

      return members;
    },
    enabled: !!profile?.id,
  });

  const createUser = useMutation({
    mutationFn: async (data: CreateUserFormData) => {
      if (!isSuperAdmin) throw new Error("Apenas super_admin pode criar usuários");
      
      const { data: result, error } = await supabase.functions.invoke("create-user", {
        body: data,
      });

      if (error) throw error;
      if (result.error) throw new Error(result.error);
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast({
        title: "Usuário criado",
        description: "O novo usuário foi criado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
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
    isSuperAdmin,
    updateMember,
    removeMember,
    createUser,
  };
}
