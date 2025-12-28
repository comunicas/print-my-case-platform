import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface UserPDV {
  id: string;
  user_id: string;
  pdv_id: string;
  created_at: string;
}

export function useUserPDVs(userId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Buscar PDVs atribuídos a um usuário específico
  const userPDVsQuery = useQuery({
    queryKey: ["user-pdvs", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("user_pdvs")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;
      return data as UserPDV[];
    },
    enabled: !!userId,
  });

  // Atribuir um PDV a um usuário
  const assignPDV = useMutation({
    mutationFn: async ({ userId, pdvId }: { userId: string; pdvId: string }) => {
      const { error } = await supabase
        .from("user_pdvs")
        .insert({ user_id: userId, pdv_id: pdvId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-pdvs", userId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atribuir PDV",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remover atribuição de PDV
  const unassignPDV = useMutation({
    mutationFn: async ({ userId, pdvId }: { userId: string; pdvId: string }) => {
      const { error } = await supabase
        .from("user_pdvs")
        .delete()
        .eq("user_id", userId)
        .eq("pdv_id", pdvId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-pdvs", userId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover atribuição",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Atualizar múltiplas atribuições de uma vez
  const bulkUpdatePDVs = useMutation({
    mutationFn: async ({ userId, pdvIds }: { userId: string; pdvIds: string[] }) => {
      // Primeiro, remover todas as atribuições existentes
      const { error: deleteError } = await supabase
        .from("user_pdvs")
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      // Se há novos PDVs para atribuir, inserir
      if (pdvIds.length > 0) {
        const insertData = pdvIds.map((pdvId) => ({
          user_id: userId,
          pdv_id: pdvId,
        }));

        const { error: insertError } = await supabase
          .from("user_pdvs")
          .insert(insertData);

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-pdvs", userId] });
      toast({
        title: "Atribuições atualizadas",
        description: "Os PDVs foram atualizados com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar atribuições",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    userPDVs: userPDVsQuery.data ?? [],
    isLoading: userPDVsQuery.isLoading,
    error: userPDVsQuery.error,
    assignPDV,
    unassignPDV,
    bulkUpdatePDVs,
  };
}
