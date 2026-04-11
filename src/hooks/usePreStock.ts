import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveOrg } from "@/contexts/ActiveOrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

export interface PreStockItem {
  id: string;
  organization_id: string;
  pdv_id: string | null;
  product_name: string;
  quantity: number;
  remaining_quantity: number;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  notes: string | null;
  allocated_pdv_id: string | null;
  unit_cost: number;
  pdv?: { id: string; name: string } | null;
  allocated_pdv?: { id: string; name: string } | null;
}

interface UsePreStockOptions {
  pdvId?: string;
  status?: string;
  search?: string;
}

export function usePreStock(options: UsePreStockOptions = {}) {
  const { activeOrgId } = useActiveOrg();
  const { user } = useAuth();
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  const isAllOrgs = activeOrgId === "all";
  const orgId = isAllOrgs ? null : (activeOrgId ?? profile?.organization_id ?? null);
  const writeOrgId = orgId ?? profile?.organization_id;

  const queryKey = ["pre_stock", activeOrgId, options.pdvId, options.status, options.search];

  const hasFilters = !!(options.pdvId && options.pdvId !== "all") || !!(options.status && options.status !== "all") || !!options.search;

  const { data: items = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!activeOrgId) return [];

      let query = supabase
        .from("pre_stock")
        .select("*, pdv:pdvs!pre_stock_pdv_id_fkey(id, name), allocated_pdv:pdvs!pre_stock_allocated_pdv_id_fkey(id, name)")
        .order("created_at", { ascending: false });

      if (orgId) {
        query = query.eq("organization_id", orgId);
      }

      if (options.pdvId && options.pdvId !== "all") {
        query = query.eq("pdv_id", options.pdvId);
      }
      if (options.status && options.status !== "all") {
        query = query.eq("status", options.status);
      }
      if (options.search) {
        query = query.ilike("product_name", `%${options.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as PreStockItem[];
    },
    enabled: !!activeOrgId,
  });

  // Unfiltered summary for KPI cards
  const { data: summary } = useQuery({
    queryKey: ["pre_stock_summary", activeOrgId],
    queryFn: async () => {
      if (!activeOrgId) return { pendingUnits: 0, pendingValue: 0, allocatedUnits: 0 };

      let query = supabase
        .from("pre_stock")
        .select("status, remaining_quantity, quantity, unit_cost");

      if (orgId) {
        query = query.eq("organization_id", orgId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data ?? []) as { status: string; remaining_quantity: number; quantity: number; unit_cost: number }[];
      const pending = rows.filter((r) => r.status === "pending");
      const allocated = rows.filter((r) => r.status === "allocated");

      return {
        pendingUnits: pending.reduce((s, r) => s + r.remaining_quantity, 0),
        pendingValue: pending.reduce((s, r) => s + r.remaining_quantity * (r.unit_cost ?? 15), 0),
        allocatedUnits: allocated.reduce((s, r) => s + r.quantity, 0),
      };
    },
    enabled: !!activeOrgId,
  });

  const createItem = useMutation({
    mutationFn: async (input: {
      pdv_id?: string | null;
      product_name: string;
      quantity: number;
      unit_cost?: number;
      notes?: string;
    }) => {
      if (!writeOrgId || !user?.id) throw new Error("Contexto inválido");

      const { error } = await supabase.from("pre_stock").insert({
        organization_id: writeOrgId,
        pdv_id: input.pdv_id || null,
        product_name: input.product_name,
        quantity: input.quantity,
        remaining_quantity: input.quantity,
        unit_cost: input.unit_cost ?? 15,
        status: "pending",
        created_by: user.id,
        notes: input.notes || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pre_stock"] });
      toast.success("Compra registrada com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao registrar compra", { description: error.message });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pre_stock").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pre_stock"] });
      toast.success("Registro removido");
    },
    onError: (error) => {
      toast.error("Erro ao remover", { description: error.message });
    },
  });

  const allocateItem = useMutation({
    mutationFn: async (input: {
      id: string;
      pdv_id: string;
      quantity: number;
      currentRemaining: number;
    }) => {
      const newRemaining = input.currentRemaining - input.quantity;
      if (newRemaining < 0) throw new Error("Quantidade excede o saldo disponível");

      const updateData: Record<string, unknown> = {
        remaining_quantity: newRemaining,
        allocated_pdv_id: input.pdv_id,
      };
      if (newRemaining === 0) {
        updateData.status = "allocated";
      }

      const { error } = await supabase
        .from("pre_stock")
        .update(updateData)
        .eq("id", input.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pre_stock"] });
      toast.success("Alocação registrada com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao alocar", { description: error.message });
    },
  });

  // Distinct product names for autocomplete
  const { data: productNames = [] } = useQuery({
    queryKey: ["pre_stock_products", activeOrgId],
    queryFn: async () => {
      if (!activeOrgId) return [];

      let pdvQuery = supabase.from("pdvs").select("id");
      if (orgId) {
        pdvQuery = pdvQuery.eq("organization_id", orgId);
      }
      const { data: pdvData, error: pdvError } = await pdvQuery;

      if (pdvError) throw pdvError;
      const pdvIds = pdvData?.map((p) => p.id) ?? [];
      if (pdvIds.length === 0) return [];

      const { data, error } = await supabase
        .from("stock_records")
        .select("product_name")
        .in("pdv_id", pdvIds);

      if (error) return [];

      return [...new Set((data ?? []).map((r) => r.product_name))].sort();
    },
    enabled: !!activeOrgId,
  });

  return {
    items,
    isLoading,
    createItem,
    deleteItem,
    productNames,
    summary: summary ?? { pendingUnits: 0, pendingValue: 0, allocatedUnits: 0 },
  };
}
