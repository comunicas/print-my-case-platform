import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function generateApiKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

export function useApiKeys() {
  const { session } = useAuth();
  const { organization } = useOrganization({ readOnly: true });
  const queryClient = useQueryClient();

  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ["api-keys", organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_keys")
        .select("id, name, key_prefix, is_active, last_used_at, created_at")
        .eq("organization_id", organization!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ApiKey[];
    },
    enabled: !!organization?.id,
  });

  const createKey = useMutation({
    mutationFn: async (name: string) => {
      if (!organization?.id || !session?.user?.id) throw new Error("Sem organização ou sessão");

      const rawKey = generateApiKey();
      const keyHash = await hashKey(rawKey);
      const keyPrefix = rawKey.substring(0, 8);

      const { error } = await supabase.from("api_keys").insert({
        organization_id: organization.id,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        name,
        created_by: session.user.id,
      });

      if (error) throw error;
      return rawKey; // Return full key only once
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("API Key criada com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao criar API Key: " + error.message);
    },
  });

  const revokeKey = useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase
        .from("api_keys")
        .update({ is_active: false })
        .eq("id", keyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("API Key revogada");
    },
    onError: (error) => {
      toast.error("Erro ao revogar API Key: " + error.message);
    },
  });

  const deleteKey = useMutation({
    mutationFn: async (keyId: string) => {
      const { error } = await supabase
        .from("api_keys")
        .delete()
        .eq("id", keyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("API Key excluída");
    },
    onError: (error) => {
      toast.error("Erro ao excluir API Key: " + error.message);
    },
  });

  return {
    apiKeys,
    isLoading,
    createKey,
    revokeKey,
    deleteKey,
  };
}
