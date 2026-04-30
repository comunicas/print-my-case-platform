import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AiMessage {
  id: string;
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  status: "ok" | "aborted" | "failed";
  created_at: string;
}

export function useAiMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["ai-messages", conversationId],
    queryFn: async (): Promise<AiMessage[]> => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from("ai_messages")
        .select("id, role, content, status, created_at")
        .eq("conversation_id", conversationId)
        .in("role", ["user", "assistant"])
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as AiMessage[];
    },
    enabled: !!conversationId,
    staleTime: 10 * 1000,
  });
}
