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
      
      // Busca o upload mais recente de estoque por PDV
      let uploadsQuery = supabase
        .from('uploads')
        .select('id, pdv_id, pdvs(name)')
        .eq('type', 'stock')
        .eq('status', 'ready')
        .order('uploaded_at', { ascending: false });
      
      if (pdvId && pdvId !== 'all') {
        uploadsQuery = uploadsQuery.eq('pdv_id', pdvId).limit(1);
      } else if (allowedPdvIds && allowedPdvIds.length > 0) {
        // Filtrar apenas pelos PDVs atribuídos ao usuário
        uploadsQuery = uploadsQuery.in('pdv_id', allowedPdvIds).limit(50);
      } else {
        // Limitar para evitar carregar histórico desnecessário
        uploadsQuery = uploadsQuery.limit(50);
      }
      
      const { data: uploads, error: uploadsError } = await uploadsQuery;
      
      if (uploadsError) throw uploadsError;
      if (!uploads || uploads.length === 0) return [];
      
      // Pega o upload mais recente de cada PDV
      const latestUploadsByPdv = new Map<string, string>();
      for (const upload of uploads) {
        if (!latestUploadsByPdv.has(upload.pdv_id)) {
          latestUploadsByPdv.set(upload.pdv_id, upload.id);
        }
      }
      
      const uploadIds = Array.from(latestUploadsByPdv.values());
      
      // Busca os registros de estoque
      const { data: stockRecords, error: stockError } = await supabase
        .from('stock_records')
        .select('id, slot_number, product_name, quantity, pdv_id, is_active')
        .in('upload_id', uploadIds);
      
      if (stockError) throw stockError;
      if (!stockRecords) return [];
      
      // Mapeia PDV IDs para nomes
      const pdvNames = new Map<string, string>();
      for (const upload of uploads) {
        const pdvData = upload.pdvs as { name: string } | null;
        if (pdvData) {
          pdvNames.set(upload.pdv_id, pdvData.name);
        }
      }
      
      // Transforma em SlotData com extração de marca (filtra registros inválidos)
      return stockRecords
        .filter(record => record.product_name)
        .map(record => ({
        id: record.id,
        slot: record.slot_number,
        productName: record.product_name,
        brand: extractBrandFromProductName(record.product_name),
        model: extractModelFromProductName(record.product_name),
        quantity: record.quantity,
        pdvId: record.pdv_id,
        pdvName: pdvNames.get(record.pdv_id),
        isActive: record.is_active ?? true,
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    placeholderData: (previousData) => previousData,
  });
}
