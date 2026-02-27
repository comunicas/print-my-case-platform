import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SlotData } from '@/lib/stockUtils';
import { extractBrandFromProductName, extractModelFromProductName } from '@/lib/productNormalization';

interface UseSlotsDataParams {
  pdvId?: string;
  /**
   * Lista de PDV IDs que o usuário pode acessar.
   * null = sem restrições (acesso a todos da org)
   * Obtido via useUserAllowedPDVs()
   */
  allowedPdvIds?: string[] | null;
}

export function useSlotsData({ pdvId, allowedPdvIds }: UseSlotsDataParams = {}) {
  return useQuery({
    queryKey: ['slots-data', pdvId, allowedPdvIds],
    queryFn: async (): Promise<SlotData[]> => {
      
      // Busca registros de estoque diretamente (a API garante atomicidade por slot)
      let stockQuery = supabase
        .from('stock_records')
        .select('id, slot_number, product_name, quantity, pdv_id, is_active, pdvs:pdv_id(name)');
      
      if (pdvId && pdvId !== 'all') {
        stockQuery = stockQuery.eq('pdv_id', pdvId);
      } else if (allowedPdvIds && allowedPdvIds.length > 0) {
        stockQuery = stockQuery.in('pdv_id', allowedPdvIds);
      }
      
      const { data: stockRecords, error: stockError } = await stockQuery;
      
      if (stockError) throw stockError;
      if (!stockRecords || stockRecords.length === 0) return [];
      
      // Transforma em SlotData com extração de marca (filtra registros inválidos)
      return stockRecords
        .filter(record => record.product_name)
        .map(record => {
          const pdvData = record.pdvs as { name: string } | null;
          return {
            id: record.id,
            slot: String(record.slot_number).padStart(2, '0'),
            productName: record.product_name,
            brand: extractBrandFromProductName(record.product_name),
            model: extractModelFromProductName(record.product_name),
            quantity: record.quantity,
            pdvId: record.pdv_id,
            pdvName: pdvData?.name,
            isActive: record.is_active ?? true,
          };
        });
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    placeholderData: (previousData) => previousData,
  });
}
