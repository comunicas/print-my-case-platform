import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useActiveOrg } from "@/contexts/ActiveOrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

export interface PendingAllocation {
  id: string;
  organization_id: string;
  upload_id: string | null;
  pdv_id: string;
  product_name: string;
  suggested_quantity: number;
  pre_stock_id: string | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  pdv?: { id: string; name: string } | null;
}

export function usePendingAllocations() {
  const { activeOrgId } = useActiveOrg();
  const { user } = useAuth();
  const { profile } = useProfile();
  const queryClient = useQueryClient();

  const isAllOrgs = activeOrgId === "all";
  const orgId = isAllOrgs ? null : (activeOrgId ?? profile?.organization_id ?? null);

  const { data: pendingAllocations = [], isLoading } = useQuery({
    queryKey: ["pending_allocations", activeOrgId],
    queryFn: async () => {
      if (!activeOrgId) return [];

      let query = supabase
        .from("pending_allocations")
        .select("*, pdv:pdvs!pending_allocations_pdv_id_fkey(id, name)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (orgId) {
        query = query.eq("organization_id", orgId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as PendingAllocation[];
    },
    enabled: !!activeOrgId,
  });

  const { data: resolvedAllocations = [] } = useQuery({
    queryKey: ["resolved_allocations", activeOrgId],
    queryFn: async () => {
      if (!activeOrgId) return [];

      let query = supabase
        .from("pending_allocations")
        .select("*, pdv:pdvs!pending_allocations_pdv_id_fkey(id, name)")
        .in("status", ["accepted", "rejected", "undone"])
        .order("resolved_at", { ascending: false })
        .limit(50);

      if (orgId) {
        query = query.eq("organization_id", orgId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as PendingAllocation[];
    },
    enabled: !!activeOrgId,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["pending_allocations"] });
    queryClient.invalidateQueries({ queryKey: ["resolved_allocations"] });
    queryClient.invalidateQueries({ queryKey: ["pre_stock"] });
  };

  const acceptAllocation = useMutation({
    mutationFn: async (allocation: PendingAllocation) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      // If we have a pre_stock_id, update the pre_stock item
      if (allocation.pre_stock_id) {
        // Fetch current pre_stock state
        const { data: preStock, error: fetchError } = await supabase
          .from("pre_stock")
          .select("remaining_quantity")
          .eq("id", allocation.pre_stock_id)
          .single();

        if (fetchError) throw fetchError;

        const newRemaining = (preStock?.remaining_quantity ?? 0) - allocation.suggested_quantity;
        const updateData: Record<string, unknown> = {
          remaining_quantity: Math.max(0, newRemaining),
          allocated_pdv_id: allocation.pdv_id,
        };
        if (newRemaining <= 0) {
          updateData.status = "allocated";
        }

        const { error: updateError } = await supabase
          .from("pre_stock")
          .update(updateData)
          .eq("id", allocation.pre_stock_id);

        if (updateError) throw updateError;
      }

      // Mark allocation as accepted
      const { error } = await supabase
        .from("pending_allocations")
        .update({
          status: "accepted",
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
        })
        .eq("id", allocation.id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Alocação confirmada");
    },
    onError: (error) => {
      toast.error("Erro ao confirmar alocação", { description: error.message });
    },
  });

  const rejectAllocation = useMutation({
    mutationFn: async (allocationId: string) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("pending_allocations")
        .update({
          status: "rejected",
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
        })
        .eq("id", allocationId);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Sugestão rejeitada");
    },
    onError: (error) => {
      toast.error("Erro ao rejeitar", { description: error.message });
    },
  });

  const acceptAll = useMutation({
    mutationFn: async (allocations: PendingAllocation[]) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      for (const allocation of allocations) {
        if (allocation.pre_stock_id) {
          const { data: preStock } = await supabase
            .from("pre_stock")
            .select("remaining_quantity")
            .eq("id", allocation.pre_stock_id)
            .single();

          const newRemaining = (preStock?.remaining_quantity ?? 0) - allocation.suggested_quantity;
          const updateData: Record<string, unknown> = {
            remaining_quantity: Math.max(0, newRemaining),
            allocated_pdv_id: allocation.pdv_id,
          };
          if (newRemaining <= 0) updateData.status = "allocated";

          await supabase
            .from("pre_stock")
            .update(updateData)
            .eq("id", allocation.pre_stock_id);
        }

        await supabase
          .from("pending_allocations")
          .update({
            status: "accepted",
            resolved_at: new Date().toISOString(),
            resolved_by: user.id,
          })
          .eq("id", allocation.id);
      }
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Todas as alocações confirmadas");
    },
    onError: (error) => {
      toast.error("Erro ao confirmar alocações", { description: error.message });
    },
  });

  return {
    pendingAllocations,
    resolvedAllocations,
    isLoading,
    acceptAllocation,
    rejectAllocation,
    acceptAll,
    count: pendingAllocations.length,
  };
}
