import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type AgentConfigRow = {
  id: string;
  model: string;
  system_prompt: string;
  reasoning_effort: string;
  max_tool_iterations: number;
  history_limit: number;
  rate_limit_per_10min: number;
  max_message_chars: number;
  updated_at: string;
  updated_by: string | null;
};

export type AgentToolRow = {
  name: string;
  enabled: boolean;
  category: string;
  description: string;
  parameters_schema: unknown;
  handler_name: string;
  display_order: number;
  updated_at: string;
};

export type KeyStatus = {
  key_prefix: string | null;
  last_tested_at: string | null;
  last_test_status: "ok" | "invalid" | "quota" | "error" | "untested" | null;
  last_test_message: string | null;
} | null;

export type AgentStatus = {
  config: AgentConfigRow | null;
  tools: AgentToolRow[];
  key_status: KeyStatus;
  available_models: string[];
  available_reasoning: string[];
  is_super_admin: boolean;
  openai_key_present: boolean;
};

async function invoke<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke("ai-agent-config", {
    body: { action, payload },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export function useAiAgentConfig() {
  const qc = useQueryClient();

  const status = useQuery({
    queryKey: ["ai-agent-config", "status"],
    queryFn: () => invoke<AgentStatus>("get-status"),
    staleTime: 30_000,
  });

  const updateConfig = useMutation({
    mutationFn: (payload: Partial<AgentConfigRow>) => invoke("update-config", payload as Record<string, unknown>),
    onSuccess: () => {
      toast.success("Configuração atualizada");
      qc.invalidateQueries({ queryKey: ["ai-agent-config"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleTool = useMutation({
    mutationFn: ({ name, enabled }: { name: string; enabled: boolean }) =>
      invoke("toggle-tool", { name, enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-agent-config"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const testKey = useMutation({
    mutationFn: () => invoke<{ status: string; message: string | null }>("test-key"),
    onSuccess: (r) => {
      if (r.status === "ok") toast.success("Chave OpenAI válida");
      else toast.error(r.message ?? `Status: ${r.status}`);
      qc.invalidateQueries({ queryKey: ["ai-agent-config"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const smokeTest = useMutation({
    mutationFn: () => invoke<{ ok: boolean; duration_ms: number; response?: any; error?: string }>("smoke-test"),
    onSuccess: (r) => {
      if (r.ok) toast.success(`Agente respondeu em ${r.duration_ms}ms`);
      else toast.error(r.error ?? "Falha no smoke test");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { status, updateConfig, toggleTool, testKey, smokeTest };
}