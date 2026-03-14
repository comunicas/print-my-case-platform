import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePDVs } from './usePDVs';
import { useActiveOrg } from '@/contexts/ActiveOrgContext';
import { filterSalesByProduct } from '@/lib/productNormalization';

export interface ProductAnalytics {
  // KPIs
  totalSales: number;
  totalRevenue: number;
  averageTicket: number;
  refundRate: number;
  
  // Por horário
  salesByHour: { hour: number; count: number; revenue: number }[];
  peakHour: { hour: number; count: number } | null;
  
  // Por dia da semana
  salesByDayOfWeek: { day: number; dayName: string; count: number; revenue: number }[];
  bestDay: { day: number; dayName: string; count: number } | null;
  
  // Por PDV
  salesByPDV: { pdvId: string; pdvName: string; count: number; revenue: number; percentage: number }[];
  
  // Por método de pagamento
  paymentMethods: { method: string; count: number; percentage: number }[];
}

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function useProductAnalytics(productName: string | null, pdvId?: string) {
  const { pdvs } = usePDVs();
  const { activeOrgId } = useActiveOrg();

  // Get PDV IDs for the active org to scope the query
  const activeOrgPdvIds = pdvs.map(p => p.id);

  return useQuery({
    queryKey: ['product-analytics', productName, pdvId, activeOrgId],
    queryFn: async (): Promise<ProductAnalytics> => {
      if (!productName) {
        throw new Error('Product name is required');
      }

      // Pre-filter server-side with ilike to reduce data transfer (~90% reduction),
      // then refine client-side with filterSalesByProduct for exact matching
      // (ilike can't distinguish "iPhone 14" from "iPhone 14 Pro Max").
      let query = supabase
        .from('sales_records')
        .select('*, order_time')
        .in('status', ['Completed', 'Pago', 'Concluído'])
        .not('payment_date', 'is', null)
        .ilike('product_name', `%${productName}%`)
        .order('payment_date', { ascending: false })
        .limit(5000);

      if (pdvId) {
        query = query.eq('pdv_id', pdvId);
      } else if (activeOrgPdvIds.length > 0) {
        // Filter by active org PDVs to prevent cross-org data leakage
        query = query.in('pdv_id', activeOrgPdvIds);
      }

      const { data: sales, error } = await query;

      if (error) throw error;

      // Filtrar por modelo exato (evita falsos positivos do ilike)
      const salesData = filterSalesByProduct(sales || [], productName);

      // Calcular KPIs
      const totalSales = salesData.length;
      const totalRevenue = salesData.reduce((sum, s) => sum + Number(s.amount || 0), 0);
      const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
      const totalRefunds = salesData.reduce((sum, s) => sum + Number(s.refund_amount || 0), 0);
      const refundRate = totalRevenue > 0 ? (totalRefunds / totalRevenue) * 100 : 0;

      // Vendas por hora - usar order_time (hora real do pedido) quando disponível, senão payment_date
      const hourCounts: Record<number, { count: number; revenue: number }> = {};
      for (let h = 0; h < 24; h++) {
        hourCounts[h] = { count: 0, revenue: 0 };
      }
      
      salesData.forEach(sale => {
        const timeSource = sale.order_time || sale.payment_date;
        if (!timeSource) return;
        const date = new Date(timeSource);
        const hour = date.getHours();
        hourCounts[hour].count++;
        hourCounts[hour].revenue += Number(sale.amount || 0);
      });

      const salesByHour = Object.entries(hourCounts).map(([hour, data]) => ({
        hour: Number(hour),
        count: data.count,
        revenue: data.revenue,
      }));

      const peakHour = salesByHour.reduce((max, curr) => 
        curr.count > (max?.count || 0) ? curr : max, 
        null as { hour: number; count: number } | null
      );

      // Vendas por dia da semana
      const dayCounts: Record<number, { count: number; revenue: number }> = {};
      for (let d = 0; d < 7; d++) {
        dayCounts[d] = { count: 0, revenue: 0 };
      }

      // Vendas por dia da semana - usar order_time quando disponível
      salesData.forEach(sale => {
        const timeSource = sale.order_time || sale.payment_date;
        if (!timeSource) return;
        const date = new Date(timeSource);
        const day = date.getUTCDay();
        dayCounts[day].count++;
        dayCounts[day].revenue += Number(sale.amount || 0);
      });

      const salesByDayOfWeek = Object.entries(dayCounts).map(([day, data]) => ({
        day: Number(day),
        dayName: DAY_NAMES[Number(day)],
        count: data.count,
        revenue: data.revenue,
      }));

      const bestDay = salesByDayOfWeek.reduce((max, curr) => 
        curr.count > (max?.count || 0) ? { ...curr } : max,
        null as { day: number; dayName: string; count: number } | null
      );

      // Vendas por PDV
      const pdvCounts: Record<string, { count: number; revenue: number }> = {};
      salesData.forEach(sale => {
        if (!pdvCounts[sale.pdv_id]) {
          pdvCounts[sale.pdv_id] = { count: 0, revenue: 0 };
        }
        pdvCounts[sale.pdv_id].count++;
        pdvCounts[sale.pdv_id].revenue += Number(sale.amount || 0);
      });

      const salesByPDV = Object.entries(pdvCounts).map(([pdvId, data]) => {
        const pdv = pdvs.find(p => p.id === pdvId);
        return {
          pdvId,
          pdvName: pdv?.name || 'PDV Desconhecido',
          count: data.count,
          revenue: data.revenue,
          percentage: totalSales > 0 ? (data.count / totalSales) * 100 : 0,
        };
      }).sort((a, b) => b.count - a.count);

      // Métodos de pagamento
      const methodCounts: Record<string, number> = {};
      salesData.forEach(sale => {
        const method = sale.payment_method || 'Não informado';
        methodCounts[method] = (methodCounts[method] || 0) + 1;
      });

      const paymentMethods = Object.entries(methodCounts).map(([method, count]) => ({
        method,
        count,
        percentage: totalSales > 0 ? (count / totalSales) * 100 : 0,
      })).sort((a, b) => b.count - a.count);

      return {
        totalSales,
        totalRevenue,
        averageTicket,
        refundRate,
        salesByHour,
        peakHour,
        salesByDayOfWeek,
        bestDay,
        salesByPDV,
        paymentMethods,
      };
    },
    enabled: !!productName,
  });
}
