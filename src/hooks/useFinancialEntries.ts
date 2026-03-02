import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { useActiveOrg } from "@/contexts/ActiveOrgContext";
import { toast } from "sonner";
import { startOfMonth, subMonths, format } from "date-fns";

export interface FinancialEntry {
  id: string;
  organization_id: string;
  pdv_id: string | null;
  category: string;
  description: string;
  amount: number;
  reference_month: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface UseFinancialEntriesOptions {
  referenceMonth: Date;
  category?: "implantacao" | "fixas" | null;
  pdvId?: string | null;
}

export function useFinancialEntries({ referenceMonth, category, pdvId }: UseFinancialEntriesOptions) {
  const { profile } = useProfile();
  const { activeOrgId } = useActiveOrg();
  const queryClient = useQueryClient();

  const isAllOrgs = activeOrgId === "all";
  const orgId = isAllOrgs ? null : (activeOrgId ?? profile?.organization_id);
  const writeOrgId = orgId ?? profile?.organization_id;
  const monthStr = format(startOfMonth(referenceMonth), "yyyy-MM-dd");

  const entriesQuery = useQuery({
    queryKey: ["financial-entries", orgId, monthStr, category, pdvId],
    queryFn: async () => {
      let query = supabase
        .from("financial_entries")
        .select("*")
        .eq("reference_month", monthStr)
        .order("created_at", { ascending: false });

      if (orgId) {
        query = query.eq("organization_id", orgId);
      }

      if (category) {
        query = query.eq("category", category);
      }

      if (pdvId) {
        query = query.or(`pdv_id.eq.${pdvId},pdv_id.is.null`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FinancialEntry[];
    },
    enabled: !!orgId || isAllOrgs,
  });

  const createEntry = useMutation({
    mutationFn: async (entry: {
      category: "deducoes" | "implantacao" | "fixas";
      description: string;
      amount: number;
      reference_month: Date;
      pdv_id?: string | null;
    }) => {
      if (!writeOrgId || !profile?.id) throw new Error("Sem organização");
      const { data, error } = await supabase
        .from("financial_entries")
        .insert({
          organization_id: writeOrgId,
          pdv_id: entry.pdv_id || null,
          category: entry.category,
          description: entry.description,
          amount: entry.amount,
          reference_month: format(startOfMonth(entry.reference_month), "yyyy-MM-dd"),
          created_by: profile.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-entries"] });
      toast.success("Despesa adicionada");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar despesa", { description: error.message });
    },
  });

  const updateEntry = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
      const { data, error } = await supabase
        .from("financial_entries")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-entries"] });
      toast.success("Despesa atualizada");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar despesa", { description: error.message });
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("financial_entries")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-entries"] });
      toast.success("Despesa excluída");
    },
    onError: (error) => {
      toast.error("Erro ao excluir despesa", { description: error.message });
    },
  });

  const copyFromPreviousMonth = useMutation({
    mutationFn: async ({ targetMonth }: { targetMonth: Date }) => {
      if (!writeOrgId || !profile?.id) throw new Error("Sem organização");
      const prevMonthStr = format(subMonths(startOfMonth(targetMonth), 1), "yyyy-MM-dd");
      const targetMonthStr = format(startOfMonth(targetMonth), "yyyy-MM-dd");

      let query = supabase
        .from("financial_entries")
        .select("*")
        .eq("reference_month", prevMonthStr)
        .in("category", ["fixas", "deducoes"]);

      if (orgId) {
        query = query.eq("organization_id", orgId);
      }

      if (pdvId) {
        query = query.or(`pdv_id.eq.${pdvId},pdv_id.is.null`);
      }

      const { data: prevEntries, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      if (!prevEntries?.length) throw new Error("Nenhuma despesa encontrada no mês anterior");

      const copies = prevEntries.map((e) => ({
        organization_id: e.organization_id,
        pdv_id: e.pdv_id,
        category: e.category,
        description: e.description,
        amount: e.amount,
        reference_month: targetMonthStr,
        created_by: profile.id,
      }));

      const { error: insertError } = await supabase
        .from("financial_entries")
        .insert(copies);
      if (insertError) throw insertError;

      return copies.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["financial-entries"] });
      queryClient.invalidateQueries({ queryKey: ["dre"] });
      toast.success(`${count} despesa(s) copiada(s) do mês anterior`);
    },
    onError: (error) => {
      toast.error("Erro ao copiar despesas", { description: error.message });
    },
  });

  // Totais por categoria
  const entries = entriesQuery.data ?? [];
  const totalDeducoes = entries
    .filter((e) => e.category === "deducoes")
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const totalImplantacao = entries
    .filter((e) => e.category === "implantacao")
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const totalFixas = entries
    .filter((e) => e.category === "fixas")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // Entries agrupadas por categoria
  const entriesByCategory = {
    deducoes: entries.filter((e) => e.category === "deducoes"),
    implantacao: entries.filter((e) => e.category === "implantacao"),
    fixas: entries.filter((e) => e.category === "fixas"),
  };

  return {
    entries,
    entriesByCategory,
    isLoading: entriesQuery.isLoading,
    error: entriesQuery.error,
    totalDeducoes,
    totalImplantacao,
    totalFixas,
    createEntry,
    updateEntry,
    deleteEntry,
    copyFromPreviousMonth,
  };
}
