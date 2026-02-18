import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PDVImpact {
  salesCount: number;
  stockCount: number;
  isLoading: boolean;
}

export function usePDVImpact(pdvId: string | null): PDVImpact {
  const { data, isLoading } = useQuery({
    queryKey: ["pdv-impact", pdvId],
    enabled: !!pdvId,
    staleTime: 0,
    queryFn: async () => {
      const [salesResult, stockResult] = await Promise.all([
        supabase
          .from("sales_records")
          .select("*", { count: "exact", head: true })
          .eq("pdv_id", pdvId!),
        supabase
          .from("stock_records")
          .select("*", { count: "exact", head: true })
          .eq("pdv_id", pdvId!),
      ]);

      return {
        salesCount: salesResult.count ?? 0,
        stockCount: stockResult.count ?? 0,
      };
    },
  });

  return {
    salesCount: data?.salesCount ?? 0,
    stockCount: data?.stockCount ?? 0,
    isLoading: !!pdvId && isLoading,
  };
}
