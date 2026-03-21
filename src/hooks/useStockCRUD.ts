import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StockRecordInput {
  pdv_id: string;
  device_id: string;
  slot_number: string;
  product_name: string;
  quantity: number;
  is_active?: boolean;
}

interface StockRecordUpdate {
  id: string;
  product_name?: string;
  quantity?: number;
  is_active?: boolean;
  slot_number?: string;
}

export function useStockCRUD() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['slots-data'] });
    queryClient.invalidateQueries({ queryKey: ['product-stock'] });
  };

  const createRecord = useMutation({
    mutationFn: async (input: StockRecordInput) => {
      const { data, error } = await supabase
        .from('stock_records')
        .insert({
          pdv_id: input.pdv_id,
          device_id: input.device_id,
          slot_number: input.slot_number,
          product_name: input.product_name,
          quantity: input.quantity,
          is_active: input.is_active ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Registro de estoque criado');
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar registro', { description: error.message });
    },
  });

  const updateRecord = useMutation({
    mutationFn: async (input: StockRecordUpdate) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from('stock_records')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Registro de estoque atualizado');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar registro', { description: error.message });
    },
  });

  const deleteRecord = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('stock_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Registro de estoque removido');
    },
    onError: (error: Error) => {
      toast.error('Erro ao remover registro', { description: error.message });
    },
  });

  return {
    createRecord,
    updateRecord,
    deleteRecord,
    isLoading: createRecord.isPending || updateRecord.isPending || deleteRecord.isPending,
  };
}
