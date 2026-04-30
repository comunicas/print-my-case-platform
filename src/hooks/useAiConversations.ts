import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProfile } from "./useProfile";

export interface AiConversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

export function useAiConversations() {
  const queryClient = useQueryClient();
  const { profile } = useProfile();

  const list = useQuery({
    queryKey: ["ai-conversations", profile?.id],
    queryFn: async (): Promise<AiConversation[]> => {
      const { data, error } = await supabase
        .from("ai_conversations")
        .select("id, title, created_at, updated_at, last_message_at")
        .order("last_message_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!profile?.id,
    staleTime: 30 * 1000,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ai_conversations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-conversations"] });
      toast.success("Conversa excluída");
    },
    onError: (e: Error) => toast.error("Erro ao excluir", { description: e.message }),
  });

  return {
    conversations: list.data ?? [],
    isLoading: list.isLoading,
    remove: remove.mutate,
  };
}
