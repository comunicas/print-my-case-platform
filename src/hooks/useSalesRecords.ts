import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { usePagination } from "@/hooks/usePaginatedQuery";

export interface SalesRecordItem {
  id: string;
  pdv_id: string;
  pdv: { name: string };
  order_number: string;
  product_name: string;
  amount: number;
  payment_date: string | null;
  payment_method: string | null;
  status: string | null;
  refund_amount: number | null;
  device_id: string;
  source: string;
  upload_id: string | null;
}

interface SalesRecordsFilters {
  pdvId: string;
  status: string;
  search: string;
}

export interface CreateSalesRecordData {
  pdv_id: string;
  device_id: string;
  order_number: string;
  product_name: string;
  amount: number;
  payment_date?: string;
  payment_method?: string;
  status?: string;
  refund_amount?: number;
}

export function useSalesRecords(filters: SalesRecordsFilters) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const pagination = usePagination(25);

  // Reset page on filter change
  useEffect(() => {
    pagination.setPage(1);
  }, [filters.pdvId, filters.status, filters.search]);

  const queryKey = ["sales-records", filters, pagination.page, pagination.pageSize];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from("sales_records")
        .select("id, pdv_id, order_number, product_name, amount, payment_date, payment_method, status, refund_amount, device_id, source, upload_id, pdvs(name)", { count: "exact" });

      if (filters.pdvId !== "all") {
        query = query.eq("pdv_id", filters.pdvId);
      }
      if (filters.status !== "all") {
        query = query.eq("status", filters.status);
      }
      if (filters.search) {
        query = query.or(`product_name.ilike.%${filters.search}%,order_number.ilike.%${filters.search}%`);
      }

      const { from, to } = pagination.getRange();
      const { data, count, error } = await query
        .order("payment_date", { ascending: false, nullsFirst: false })
        .range(from, to);

      if (error) throw error;
      return { records: data ?? [], totalCount: count ?? 0 };
    },
    enabled: !!session,
  });

  useEffect(() => {
    if (data?.totalCount !== undefined) {
      pagination.setTotalCount(data.totalCount);
    }
  }, [data?.totalCount]);

  const records: SalesRecordItem[] = (data?.records ?? []).map((r: any) => ({
    ...r,
    pdv: r.pdvs ?? { name: "—" },
  }));

  const createRecord = useMutation({
    mutationFn: async (input: CreateSalesRecordData) => {
      const { error } = await supabase.from("sales_records").insert({
        ...input,
        source: "manual",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Venda criada com sucesso");
      queryClient.invalidateQueries({ queryKey: ["sales-records"] });
    },
    onError: () => toast.error("Erro ao criar venda"),
  });

  const updateRecord = useMutation({
    mutationFn: async ({ id, ...input }: CreateSalesRecordData & { id: string }) => {
      const { error } = await supabase.from("sales_records").update(input).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Venda atualizada");
      queryClient.invalidateQueries({ queryKey: ["sales-records"] });
    },
    onError: () => toast.error("Erro ao atualizar venda"),
  });

  const deleteRecord = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sales_records").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Venda excluída");
      queryClient.invalidateQueries({ queryKey: ["sales-records"] });
    },
    onError: () => toast.error("Erro ao excluir venda"),
  });

  return {
    records,
    isLoading,
    totalCount: data?.totalCount ?? 0,
    pagination,
    createRecord,
    updateRecord,
    deleteRecord,
  };
}
