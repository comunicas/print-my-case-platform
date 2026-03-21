import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePagination } from './usePaginatedQuery';
import { useStockFilters } from '@/contexts/StockFiltersContext';
import { useUserAllowedPDVs } from './useUserAllowedPDVs';

export interface SalesRecord {
  id: string;
  payment_date: string | null;
  product_name: string;
  amount: number;
  status: string | null;
  payment_method: string | null;
  order_number: string;
  pdv_id: string;
}

export function usePDVSalesData() {
  const { selectedPdv } = useStockFilters();
  const { allowedPdvIds } = useUserAllowedPDVs();
  const pagination = usePagination(25);

  const { data, isLoading } = useQuery({
    queryKey: ['pdv-sales-data', selectedPdv, allowedPdvIds, pagination.page, pagination.pageSize],
    queryFn: async () => {
      const { from, to } = pagination.getRange();

      let query = supabase
        .from('sales_records')
        .select('id, payment_date, product_name, amount, status, payment_method, order_number, pdv_id', { count: 'exact' })
        .order('payment_date', { ascending: false })
        .range(from, to);

      if (selectedPdv && selectedPdv !== 'all') {
        query = query.eq('pdv_id', selectedPdv);
      } else if (allowedPdvIds && allowedPdvIds.length > 0) {
        query = query.in('pdv_id', allowedPdvIds);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      return { records: (data as SalesRecord[]) || [], totalCount: count || 0 };
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  // Sync total count
  if (data?.totalCount !== undefined && data.totalCount !== pagination.totalCount) {
    pagination.setTotalCount(data.totalCount);
  }

  return {
    sales: data?.records || [],
    isLoading,
    pagination,
  };
}
