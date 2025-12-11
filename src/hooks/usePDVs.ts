import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { useToast } from "@/hooks/use-toast";

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

export function usePDVs() {
  const { profile, isAdmin } = useProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const pdvsQuery = useQuery({
    queryKey: ["pdvs", profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pdvs")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as PDV[];
    },
    enabled: !!profile?.organization_id,
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
      toast({
        title: "PDV criado",
        description: "O PDV foi adicionado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar PDV",
        description: error.message,
        variant: "destructive",
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
      toast({
        title: "PDV atualizado",
        description: "As informações foram salvas.",
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

  const deletePDV = useMutation({
    mutationFn: async (id: string) => {
      if (!isAdmin) throw new Error("Permissão negada");
      
      const { error } = await supabase
        .from("pdvs")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdvs"] });
      toast({
        title: "PDV excluído",
        description: "O PDV foi removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
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
