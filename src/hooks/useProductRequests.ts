import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type ProductRequestStatus = "pending" | "contacted" | "resolved" | "cancelled";

export interface ProductRequest {
  id: string;
  organization_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  requested_model: string;
  message: string | null;
  status: ProductRequestStatus;
  created_at: string;
}

export interface ProductRequestStats {
  total: number;
  pending: number;
  contacted: number;
  resolved: number;
  cancelled: number;
  todayCount: number;
  weekCount: number;
}

interface UseProductRequestsOptions {
  status?: ProductRequestStatus | "all";
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export function useProductRequests(options: UseProductRequestsOptions = {}) {
  const queryClient = useQueryClient();
  const { status = "all", dateFrom, dateTo, search } = options;

  const { data: requests, isLoading, error } = useQuery({
    queryKey: ["product-requests", status, dateFrom?.toISOString(), dateTo?.toISOString(), search],
    queryFn: async () => {
      let query = supabase
        .from("product_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (status !== "all") {
        query = query.eq("status", status);
      }

      if (dateFrom) {
        query = query.gte("created_at", dateFrom.toISOString());
      }

      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte("created_at", endOfDay.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Client-side search filtering
      let filteredData = data as ProductRequest[];
      if (search) {
        const searchLower = search.toLowerCase();
        filteredData = filteredData.filter(
          r =>
            r.customer_name.toLowerCase().includes(searchLower) ||
            r.customer_phone.includes(search) ||
            r.requested_model.toLowerCase().includes(searchLower)
        );
      }

      return filteredData;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["product-requests-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_requests")
        .select("status, created_at");

      if (error) throw error;

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfWeek.getDate() - 7);

      const stats: ProductRequestStats = {
        total: data.length,
        pending: data.filter(r => r.status === "pending").length,
        contacted: data.filter(r => r.status === "contacted").length,
        resolved: data.filter(r => r.status === "resolved").length,
        cancelled: data.filter(r => r.status === "cancelled").length,
        todayCount: data.filter(r => new Date(r.created_at) >= startOfToday).length,
        weekCount: data.filter(r => new Date(r.created_at) >= startOfWeek).length,
      };

      return stats;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ProductRequestStatus }) => {
      const { error } = await supabase
        .from("product_requests")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-requests"] });
      queryClient.invalidateQueries({ queryKey: ["product-requests-stats"] });
      toast({
        title: "Status atualizado!",
        description: "O status do pedido foi atualizado.",
      });
    },
    onError: (error) => {
      console.error("Error updating status:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    },
  });

  const deleteRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("product_requests")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-requests"] });
      queryClient.invalidateQueries({ queryKey: ["product-requests-stats"] });
      toast({
        title: "Pedido removido!",
        description: "O pedido foi removido com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Error deleting request:", error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover o pedido.",
        variant: "destructive",
      });
    },
  });

  return {
    requests: requests || [],
    stats: stats || {
      total: 0,
      pending: 0,
      contacted: 0,
      resolved: 0,
      cancelled: 0,
      todayCount: 0,
      weekCount: 0,
    },
    isLoading,
    error,
    updateStatus,
    deleteRequest,
  };
}
