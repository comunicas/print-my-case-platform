import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { toast } from "sonner";

export interface PDV {
  id: string;
  organization_id: string;
  name: string;
  location: string;
  machine_id: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export type PDVInsert = Omit<PDV, "id" | "created_at" | "updated_at">;
export type PDVUpdate = Partial<Omit<PDV, "id" | "organization_id" | "created_at" | "updated_at">>;

interface UsePDVsOptions {
  organizationId?: string;
}

export function usePDVs(options?: UsePDVsOptions) {
  const { profile, isAdmin } = useProfile();
  const queryClient = useQueryClient();
  
  const filterOrgId = options?.organizationId;

  const pdvsQuery = useQuery({
    queryKey: ["pdvs", profile?.organization_id, filterOrgId],
    queryFn: async () => {
      let query = supabase
        .from("pdvs")
        .select("*")
        .order("name");
      
      // Se um organizationId específico foi passado, filtrar por ele
      if (filterOrgId && filterOrgId !== "all") {
        query = query.eq("organization_id", filterOrgId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as PDV[];
    },
    enabled: !!profile?.organization_id,
    staleTime: 30 * 1000,    // 30 seconds — força refetch rápido após mutações
    gcTime: 5 * 60 * 1000,   // 5 minutes
  });

  const createPDV = useMutation({
    mutationFn: async (pdv: Omit<PDVInsert, "organization_id">) => {
      if (!profile?.organization_id) throw new Error("Organização não encontrada");
      if (!isAdmin) throw new Error("Permissão negada");
      
      const { data, error } = await supabase
        .from("pdvs")
        .insert({
          ...pdv,
          organization_id: profile.organization_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdvs"] });
      toast.success("PDV criado", {
        description: "O PDV foi adicionado com sucesso.",
      });
    },
    onError: (error) => {
      toast.error("Erro ao criar PDV", {
        description: error.message,
      });
    },
  });

  const updatePDV = useMutation({
    mutationFn: async ({ id, ...updates }: PDVUpdate & { id: string }) => {
      if (!isAdmin) throw new Error("Permissão negada");
      
      const { data, error } = await supabase
        .from("pdvs")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdvs"] });
      toast.success("PDV atualizado", {
        description: "As informações foram salvas.",
      });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar", {
        description: error.message,
      });
    },
  });

  const deletePDV = useMutation({
    mutationFn: async (id: string) => {
      if (!isAdmin) throw new Error("Permissão negada");
      
      const { error } = await supabase
        .from("pdvs")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onMutate: async (id: string) => {
      // Cancela qualquer refetch pendente para evitar sobrescrever o optimistic update
      await queryClient.cancelQueries({ queryKey: ["pdvs"] });

      // Snapshot do estado anterior para rollback em caso de erro
      const previousPDVs = queryClient.getQueryData<PDV[]>(["pdvs", profile?.organization_id, filterOrgId]);

      // Remove imediatamente o PDV da lista local
      queryClient.setQueryData<PDV[]>(
        ["pdvs", profile?.organization_id, filterOrgId],
        (old) => old?.filter((pdv) => pdv.id !== id) ?? []
      );

      return { previousPDVs };
    },
    onSuccess: () => {
      // Força refetch imediato para sincronizar com o banco
      queryClient.invalidateQueries({ queryKey: ["pdvs"] });
      queryClient.refetchQueries({ queryKey: ["pdvs"] });
      toast.success("PDV excluído", {
        description: "O PDV foi removido com sucesso.",
      });
    },
    onError: (error, _id, context) => {
      // Restaura o estado anterior em caso de erro
      if (context?.previousPDVs) {
        queryClient.setQueryData(
          ["pdvs", profile?.organization_id, filterOrgId],
          context.previousPDVs
        );
      }
      toast.error("Erro ao excluir PDV", {
        description: error.message,
      });
    },
  });

  return {
    pdvs: pdvsQuery.data ?? [],
    isLoading: pdvsQuery.isLoading,
    error: pdvsQuery.error,
    createPDV,
    updatePDV,
    deletePDV,
  };
}
