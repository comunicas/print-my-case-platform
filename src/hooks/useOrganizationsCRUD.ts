import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { toast } from "sonner";

export interface OrganizationWithStats {
  id: string;
  name: string;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  plan: string | null;
  owner_id: string | null;
  active_since: string | null;
  created_at: string | null;
  usersCount: number;
  pdvsCount: number;
}

export interface OrganizationInsert {
  name: string;
  cnpj?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  plan?: string | null;
}

export interface OrganizationUpdate extends Partial<OrganizationInsert> {
  id: string;
}

export function useOrganizationsCRUD() {
  const { role } = useProfile();
  const queryClient = useQueryClient();
  const isSuperAdmin = role === "super_admin";

  const organizationsQuery = useQuery({
    queryKey: ["organizations-with-stats"],
    queryFn: async () => {
      // Fetch organizations
      const { data: orgs, error: orgsError } = await supabase
        .from("organizations")
        .select("*")
        .order("name");

      if (orgsError) throw orgsError;

      // Fetch user counts per organization
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("organization_id");

      if (profilesError) throw profilesError;

      // Fetch PDV counts per organization
      const { data: pdvs, error: pdvsError } = await supabase
        .from("pdvs")
        .select("organization_id");

      if (pdvsError) throw pdvsError;

      // Count users and PDVs per organization
      const usersCounts = profiles.reduce((acc, p) => {
        if (p.organization_id) {
          acc[p.organization_id] = (acc[p.organization_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const pdvsCounts = pdvs.reduce((acc, p) => {
        if (p.organization_id) {
          acc[p.organization_id] = (acc[p.organization_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Combine data
      return orgs.map((org) => ({
        ...org,
        usersCount: usersCounts[org.id] || 0,
        pdvsCount: pdvsCounts[org.id] || 0,
      })) as OrganizationWithStats[];
    },
    enabled: isSuperAdmin,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const createOrganization = useMutation({
    mutationFn: async (data: OrganizationInsert) => {
      if (!isSuperAdmin) throw new Error("Permissão negada");

      const { data: newOrg, error } = await supabase
        .from("organizations")
        .insert({
          name: data.name,
          cnpj: data.cnpj || null,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
          plan: data.plan || "Profissional",
        })
        .select()
        .single();

      if (error) throw error;
      return newOrg;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations-with-stats"] });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toast.success("Organização criada", {
        description: "A organização foi criada com sucesso.",
      });
    },
    onError: (error) => {
      toast.error("Erro ao criar organização", {
        description: error.message,
      });
    },
  });

  const updateOrganization = useMutation({
    mutationFn: async ({ id, ...data }: OrganizationUpdate) => {
      if (!isSuperAdmin) throw new Error("Permissão negada");

      const { data: updatedOrg, error } = await supabase
        .from("organizations")
        .update({
          name: data.name,
          cnpj: data.cnpj,
          email: data.email,
          phone: data.phone,
          address: data.address,
          plan: data.plan,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updatedOrg;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations-with-stats"] });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toast.success("Organização atualizada", {
        description: "As informações foram salvas.",
      });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar", {
        description: error.message,
      });
    },
  });

  const deleteOrganization = useMutation({
    mutationFn: async (id: string) => {
      if (!isSuperAdmin) throw new Error("Permissão negada");

      const { error } = await supabase
        .from("organizations")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations-with-stats"] });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toast.success("Organização excluída", {
        description: "A organização foi removida com sucesso.",
      });
    },
    onError: (error) => {
      toast.error("Erro ao excluir", {
        description: error.message,
      });
    },
  });

  return {
    organizations: organizationsQuery.data ?? [],
    isLoading: organizationsQuery.isLoading,
    error: organizationsQuery.error,
    isSuperAdmin,
    createOrganization,
    updateOrganization,
    deleteOrganization,
  };
}
