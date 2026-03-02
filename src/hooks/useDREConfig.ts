import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { useActiveOrg } from "@/contexts/ActiveOrgContext";
import { toast } from "sonner";

export interface DREConfig {
  id: string;
  organization_id: string;
  pdv_id: string | null;
  unit_cost: number;
  stone_rate: number;
  tax_rate: number;
  created_at: string;
  updated_at: string;
}

export function useDREConfig({ pdvId }: { pdvId?: string | null } = {}) {
  const { profile } = useProfile();
  const { activeOrgId } = useActiveOrg();
  const queryClient = useQueryClient();

  const isAllOrgs = activeOrgId === "all";
  const orgId = isAllOrgs ? profile?.organization_id : (activeOrgId ?? profile?.organization_id);
  const writeOrgId = orgId ?? profile?.organization_id;

  const configQuery = useQuery({
    queryKey: ["dre-config", orgId, pdvId],
    queryFn: async () => {
      if (!orgId) return null;

      // Try PDV-specific config first, then org-level
      if (pdvId) {
        const { data: pdvConfig } = await supabase
          .from("dre_config")
          .select("*")
          .eq("organization_id", orgId)
          .eq("pdv_id", pdvId)
          .maybeSingle();

        if (pdvConfig) return pdvConfig as DREConfig;
      }

      // Fallback to org-level config (pdv_id IS NULL)
      const { data, error } = await supabase
        .from("dre_config")
        .select("*")
        .eq("organization_id", orgId)
        .is("pdv_id", null)
        .maybeSingle();

      if (error) throw error;
      return data as DREConfig | null;
    },
    enabled: !!orgId,
  });

  const upsertConfig = useMutation({
    mutationFn: async (values: { unit_cost: number; stone_rate: number; tax_rate: number }) => {
      if (!writeOrgId) throw new Error("Sem organização");

      // Check if config already exists
      const { data: existing } = await supabase
        .from("dre_config")
        .select("id")
        .eq("organization_id", writeOrgId)
        .is("pdv_id", null)
        .maybeSingle();

      if (existing) {
        // UPDATE existing record by id
        const { data, error } = await supabase
          .from("dre_config")
          .update({
            unit_cost: values.unit_cost,
            stone_rate: values.stone_rate,
            tax_rate: values.tax_rate,
          })
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        // INSERT new record
        const { data, error } = await supabase
          .from("dre_config")
          .insert({
            organization_id: writeOrgId,
            unit_cost: values.unit_cost,
            stone_rate: values.stone_rate,
            tax_rate: values.tax_rate,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dre-config"] });
      queryClient.invalidateQueries({ queryKey: ["dre-sales"] });
      toast.success("Configuração salva");
    },
    onError: (error: Error) => {
      toast.error("Erro ao salvar configuração", { description: error.message });
    },
  });

  const config = configQuery.data;

  return {
    config,
    unitCost: config?.unit_cost ?? 0,
    stoneRate: config?.stone_rate ?? 0,
    taxRate: config?.tax_rate ?? 0,
    isLoading: configQuery.isLoading,
    upsertConfig,
  };
}
