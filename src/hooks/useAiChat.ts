import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SendOptions {
  conversationId: string | null;
  message: string;
}

interface SendResult {
  conversationId: string;
  message: string;
}

export function useAiChat() {
  const [isSending, setIsSending] = useState(false);
  const queryClient = useQueryClient();

  const send = async ({ conversationId, message }: SendOptions): Promise<SendResult | null> => {
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-agent", {
        body: { conversationId, message },
      });

      if (error) {
        const ctx = (error as { context?: { status?: number } }).context;
        const status = ctx?.status;
        if (status === 429) toast.error("Você enviou muitas mensagens. Aguarde um instante.");
        else if (status === 402) toast.error("Créditos de IA esgotados. Adicione créditos no workspace.");
        else if (status === 403) toast.error("Acesso restrito a administradores.");
        else toast.error("Erro ao consultar o assistente", { description: error.message });
        return null;
      }

      if (!data?.conversationId || typeof data.message !== "string") {
        toast.error("Resposta inválida do assistente.");
        return null;
      }

      await queryClient.invalidateQueries({ queryKey: ["ai-messages", data.conversationId] });
      await queryClient.invalidateQueries({ queryKey: ["ai-conversations"] });

      return { conversationId: data.conversationId, message: data.message };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      toast.error("Erro ao consultar o assistente", { description: msg });
      return null;
    } finally {
      setIsSending(false);
    }
  };

  return { send, isSending };
}
