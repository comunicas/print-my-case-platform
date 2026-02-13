import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { toast } from "sonner";

export interface Organization {
  id: string;
  name: string;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  plan: string | null;
  active_since: string | null;
  created_at: string;
}

interface UseOrganizationOptions {
  readOnly?: boolean;
}

export function useOrganization(options: UseOrganizationOptions = {}) {
  const { readOnly = false } = options;
  const { profile, isAdmin } = useProfile();
  const queryClient = useQueryClient();

  const organizationQuery = useQuery({
    queryKey: ["organization", profile?.organization_id, isAdmin, readOnly],
    queryFn: async () => {
      if (!profile?.organization_id) return null;
      // Em modo readOnly, qualquer usuário autenticado pode acessar (RLS valida)
      // Em modo normal, apenas admins podem acessar
      if (!readOnly && !isAdmin) return null;
      
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", profile.organization_id)
        .maybeSingle();

      if (error) {
        // Handle case where user doesn't have access
        if (error.code === "PGRST116") return null;
        throw error;
      }
      return data as Organization | null;
    },
    enabled: !!profile?.organization_id && (readOnly || isAdmin),
  });

  const updateOrganization = useMutation({
    mutationFn: async (updates: Partial<Organization>) => {
      if (!profile?.organization_id) throw new Error("Organização não encontrada");
      if (!isAdmin) throw new Error("Permissão negada");
      
      const { data, error } = await supabase
        .from("organizations")
        .update(updates)
        .eq("id", profile.organization_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", profile?.organization_id] });
      toast.success("Organização atualizada", {
        description: "As informações foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar", {
        description: error.message,
      });
    },
  });

  return {
    organization: organizationQuery.data,
    isLoading: organizationQuery.isLoading,
    error: organizationQuery.error,
    updateOrganization,
  };
}
