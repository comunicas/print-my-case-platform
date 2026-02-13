import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

export interface CatalogLead {
  id: string;
  organization_id: string;
  pdv_id: string | null;
  phone: string;
  product_name: string;
  catalog_slug: string;
  created_at: string;
}

export interface CatalogLeadStats {
  total: number;
  todayCount: number;
  weekCount: number;
  topProduct: string | null;
}

interface UseCatalogLeadsOptions {
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export function useCatalogLeads(options: UseCatalogLeadsOptions = {}) {
  const queryClient = useQueryClient();
  const { dateFrom, dateTo, search } = options;

  const { data: leads, isLoading } = useQuery({
    queryKey: ["catalog-leads", dateFrom?.toISOString(), dateTo?.toISOString(), search],
    queryFn: async () => {
      let query = supabase
        .from("catalog_leads")
        .select("*")
        .order("created_at", { ascending: false });

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

      let filtered = data as CatalogLead[];
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(
          (l) =>
            l.phone.includes(search) ||
            l.product_name.toLowerCase().includes(s) ||
            l.catalog_slug.toLowerCase().includes(s)
        );
      }

      return filtered;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["catalog-leads-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog_leads")
        .select("product_name, created_at");

      if (error) throw error;

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfWeek.getDate() - 7);

      // Count product occurrences for top product
      const productCounts: Record<string, number> = {};
      for (const lead of data) {
        productCounts[lead.product_name] = (productCounts[lead.product_name] || 0) + 1;
      }
      const topProduct = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

      const stats: CatalogLeadStats = {
        total: data.length,
        todayCount: data.filter((r) => new Date(r.created_at) >= startOfToday).length,
        weekCount: data.filter((r) => new Date(r.created_at) >= startOfWeek).length,
        topProduct,
      };

      return stats;
    },
  });

  const deleteLead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("catalog_leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog-leads"] });
      queryClient.invalidateQueries({ queryKey: ["catalog-leads-stats"] });
      toast.success("Lead removido!");
    },
    onError: () => {
      toast.error("Erro ao remover lead.");
    },
  });

  const exportCSV = () => {
    if (!leads || leads.length === 0) {
      toast.info("Nenhum lead para exportar.");
      return;
    }

    const header = "Data,WhatsApp,Produto,Catálogo";
    const rows = leads.map((l) => {
      const date = format(new Date(l.created_at), "dd/MM/yyyy HH:mm");
      return `${date},${l.phone},"${l.product_name}",${l.catalog_slug}`;
    });

    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-catalogo-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return {
    leads: leads || [],
    stats: stats || { total: 0, todayCount: 0, weekCount: 0, topProduct: null },
    isLoading,
    deleteLead,
    exportCSV,
  };
}
