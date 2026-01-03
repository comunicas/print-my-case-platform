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
  pdv_count: number;
}

export function useTeamMembers() {
  const { profile, role, isAdmin } = useProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const isSuperAdmin = role === "super_admin";

  const teamQuery = useQuery({
    queryKey: ["team-members", profile?.organization_id, isSuperAdmin, isAdmin],
    queryFn: async () => {
      // Only admins can list team members (RLS enforced)
      if (!isAdmin) return [];
      
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
      if (!profiles || profiles.length === 0) return [];

      // Then get roles for each profile
      const profileIds = profiles.map(p => p.id);
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*")
        .in("user_id", profileIds);

      if (rolesError) throw rolesError;

      // Fetch PDV counts for each user
      const { data: pdvAssignments, error: pdvError } = await supabase
        .from("user_pdvs")
        .select("user_id")
        .in("user_id", profileIds);

      if (pdvError) throw pdvError;

      // Count PDVs per user
      const pdvCountMap = new Map<string, number>();
      pdvAssignments?.forEach(up => {
        pdvCountMap.set(up.user_id, (pdvCountMap.get(up.user_id) || 0) + 1);
      });

      // Combine profiles with roles and PDV counts
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
          pdv_count: pdvCountMap.get(profile.id) || 0,
        };
      });

      return members;
    },
    enabled: !!profile?.id && isAdmin,
  });

  const createUser = useMutation({
    mutationFn: async (data: CreateUserFormData) => {
      if (!isSuperAdmin) throw new Error("Apenas super_admin pode criar usuários");
      
      const { data: result, error } = await supabase.functions.invoke("create-user", {
        body: {
          name: data.name,
          email: data.email,
          password: data.password,
          createNewOrganization: data.createNewOrganization,
          organizationId: data.organizationId,
          organizationName: data.organizationName,
          role: data.role,
        },
      });

      if (error) {
        // Try to extract error message from response body
        if (error.context && typeof error.context.json === 'function') {
          try {
            const errorBody = await error.context.json();
            if (errorBody?.error) {
              throw new Error(errorBody.error);
            }
          } catch (parseError) {
            // If we can't parse, check if there's a message in the error
            if (parseError instanceof Error && parseError.message !== error.message) {
              throw parseError;
            }
          }
        }
        throw error;
      }
      
      if (result?.error) throw new Error(result.error);
      
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      const roleLabel = result.user?.role === 'org_admin' ? 'administrador' : 
                        result.user?.role === 'operator' ? 'operador' : 'visualizador';
      toast({
        title: "Usuário criado",
        description: `${result.user?.name} foi criado como ${roleLabel} em ${result.user?.organization?.name}.`,
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

  // Helper para verificar se pode atribuir um role
  const canAssignRole = (newRole: TeamMember["role"]): boolean => {
    if (newRole === "super_admin" || newRole === "org_admin") {
      return isSuperAdmin;
    }
    return isAdmin;
  };

  const updateMember = useMutation({
    mutationFn: async (data: { 
      userId: string; 
      name: string; 
      role: TeamMember["role"]; 
      status: TeamMember["status"];
    }) => {
      if (!isAdmin) throw new Error("Permissão negada");
      
      // Validação de hierarquia de roles
      if (!canAssignRole(data.role)) {
        throw new Error("Você não tem permissão para atribuir este role");
      }
      
      // Update profile (name and status)
      const { data: updatedProfile, error: profileError } = await supabase
        .from("profiles")
        .update({ 
          name: data.name, 
          status: data.status,
          updated_at: new Date().toISOString() 
        })
        .eq("id", data.userId)
        .select();
      
      if (profileError) throw profileError;
      if (!updatedProfile || updatedProfile.length === 0) {
        throw new Error("Não foi possível atualizar o perfil. Verifique suas permissões.");
      }
      
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
      const { data: updatedProfile, error } = await supabase
        .from("profiles")
        .update({ 
          organization_id: null, 
          status: "inactive",
          updated_at: new Date().toISOString()
        })
        .eq("id", userId)
        .select();

      if (error) throw error;
      if (!updatedProfile || updatedProfile.length === 0) {
        throw new Error("Não foi possível remover o membro. Verifique suas permissões.");
      }
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
    canAssignRole,
    updateMember,
    removeMember,
    createUser,
  };
}
