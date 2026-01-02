import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { useToast } from "@/hooks/use-toast";

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
  // Campos do catálogo público
  public_slug: string | null;
  public_catalog_enabled: boolean | null;
  catalog_code_enabled: boolean | null;
  catalog_code: string | null;
  catalog_pdv_id: string | null;
  catalog_qrcode_url: string | null;
}

export function useOrganization() {
  const { profile, isAdmin } = useProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const organizationQuery = useQuery({
    queryKey: ["organization", profile?.organization_id, isAdmin],
    queryFn: async () => {
      if (!profile?.organization_id) return null;
      // Only admins can access organization data (RLS enforced)
      if (!isAdmin) return null;
      
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
    enabled: !!profile?.organization_id && isAdmin,
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
      toast({
        title: "Organização atualizada",
        description: "As informações foram salvas com sucesso.",
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
    organization: organizationQuery.data,
    isLoading: organizationQuery.isLoading,
    error: organizationQuery.error,
    updateOrganization,
  };
}
