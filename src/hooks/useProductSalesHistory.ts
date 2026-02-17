import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { filterSalesByProduct } from '@/lib/productNormalization';

export interface SalesHistoryData {
  date: string;
  dateDisplay: string;
  salesCount: number;
  revenue: number;
}

export interface SalesHistoryResult {
  data: SalesHistoryData[];
  trend: {
    percentage: number | null;
    direction: 'up' | 'down' | 'neutral';
    currentPeriodTotal: number;
    previousPeriodTotal: number;
  };
}

interface UseProductSalesHistoryOptions {
  productName: string | null;
  days?: number;
  pdvId?: string;
}

export function useProductSalesHistory({ 
  productName, 
  days = 30,
  pdvId 
}: UseProductSalesHistoryOptions) {
  return useQuery({
    queryKey: ['product-sales-history', productName, days, pdvId],
    queryFn: async (): Promise<SalesHistoryResult> => {
      if (!productName) {
        return {
          data: [],
          trend: { percentage: null, direction: 'neutral', currentPeriodTotal: 0, previousPeriodTotal: 0 }
        };
      }

      const endDate = new Date();
      const startDate = subDays(endDate, days * 2); // Fetch double for trend comparison

      // Only include successful payment statuses
      let query = supabase
        .from('sales_records')
        .select('payment_date, amount, product_name')
        .gte('payment_date', startDate.toISOString())
        .lte('payment_date', endDate.toISOString())
        .in('status', ['Completed', 'Pago', 'Concluído']);

      if (pdvId && pdvId !== 'all') {
        query = query.eq('pdv_id', pdvId);
      }

      const { data: salesData, error } = await query;

      if (error) throw error;

      // Filter by exact product model match
      const filteredSales = filterSalesByProduct(salesData || [], productName);

      // Create date range for the requested period
      const periodStart = subDays(endDate, days - 1);
      const dateRange = eachDayOfInterval({ start: periodStart, end: endDate });

      // Group sales by date
      const salesByDate = new Map<string, { count: number; revenue: number }>();
      
      filteredSales.forEach(sale => {
        const dateKey = format(new Date(sale.payment_date), 'yyyy-MM-dd');
        const existing = salesByDate.get(dateKey) || { count: 0, revenue: 0 };
        salesByDate.set(dateKey, {
          count: existing.count + 1,
          revenue: existing.revenue + Number(sale.amount)
        });
      });

      // Build chart data with all dates (including zero sales days)
      const chartData: SalesHistoryData[] = dateRange.map(date => {
        const dateKey = format(date, 'yyyy-MM-dd');
        const dayData = salesByDate.get(dateKey) || { count: 0, revenue: 0 };
        
        return {
          date: dateKey,
          dateDisplay: format(date, 'EEE, d MMM', { locale: ptBR }),
          salesCount: dayData.count,
          revenue: dayData.revenue
        };
      });

      // Calculate trend (current period vs previous period)
      const halfPoint = Math.floor(days / 2);
      const currentPeriodData = chartData.slice(-halfPoint);
      const previousPeriodData = chartData.slice(0, halfPoint);

      const currentPeriodTotal = currentPeriodData.reduce((sum, d) => sum + d.salesCount, 0);
      const previousPeriodTotal = previousPeriodData.reduce((sum, d) => sum + d.salesCount, 0);

      let percentage: number | null = null;
      let direction: 'up' | 'down' | 'neutral' = 'neutral';

      if (previousPeriodTotal > 0) {
        percentage = Math.round(((currentPeriodTotal - previousPeriodTotal) / previousPeriodTotal) * 100);
        direction = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'neutral';
      } else if (currentPeriodTotal > 0) {
        percentage = 100;
        direction = 'up';
      }

      return {
        data: chartData,
        trend: {
          percentage,
          direction,
          currentPeriodTotal,
          previousPeriodTotal
        }
      };
    },
    enabled: !!productName,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
