import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSlotsData } from './useSlotsData';
import { useStockFilters } from '@/contexts/StockFiltersContext';
import { useUserAllowedPDVs } from './useUserAllowedPDVs';
import { 
  ProductStock, 
  StockKPIs, 
  SlotData,
  aggregateProductStock, 
  calculateStockKPIs,
  extractUniqueBrands,
  getSalesIndex,
  getProductActionStatus,
  matchesSearchFilter,
} from '@/lib/stockUtils';
import { GRID_LAYOUT } from '@/lib/stockGridUtils';
import type { ProductSuggestion } from '@/components/stock/ProductSearchAutocomplete';
import { PRODUCT_STOCK_SALES_LIMIT } from '@/lib/constants';

export function useProductStock() {
  const filters = useStockFilters();
  const { allowedPdvIds } = useUserAllowedPDVs();
  
  const { 
    data: slots = [], 
    isLoading: slotsLoading,
    isFetching: slotsFetching,
    refetch: refetchSlots,
  } = useSlotsData({ 
    pdvId: filters.selectedPdv,
    allowedPdvIds,
  });
  
  // Busca dados de vendas para calcular índice
  const { 
    data: salesData = [], 
    isLoading: salesLoading,
    isFetching: salesFetching,
    refetch: refetchSales,
  } = useQuery({
    queryKey: ['sales-summary', filters.selectedPdv, filters.saleStatusFilter, allowedPdvIds],
    queryFn: async () => {
      // Map filter value to database status values
      const statusMap: Record<string, string[]> = {
        completed: ['Completed', 'Pago', 'Concluído'],
        cancelled: ['Cancelado', 'Cancelled'],
        refunded: ['Refunded'],
        all: ['Completed', 'Pago', 'Concluído', 'Cancelado', 'Cancelled', 'Refunded'],
      };
      const statuses = statusMap[filters.saleStatusFilter] || statusMap.completed;
      
      let query = supabase
        .from('sales_records')
        .select('product_name, pdv_id')
        .in('status', statuses)
        .order('payment_date', { ascending: false })
        .limit(PRODUCT_STOCK_SALES_LIMIT);
      
      if (filters.selectedPdv && filters.selectedPdv !== 'all') {
        query = query.eq('pdv_id', filters.selectedPdv);
      } else if (allowedPdvIds && allowedPdvIds.length > 0) {
        query = query.in('pdv_id', allowedPdvIds);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
  
  // Agrupa vendas por produto
  const salesByProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const sale of salesData) {
      const current = map.get(sale.product_name) || 0;
      map.set(sale.product_name, current + 1);
    }
    return map;
  }, [salesData]);
  
  // Agrega produtos e aplica filtros
  const { products, kpis, brands, suggestions, filteredSlots } = useMemo(() => {
    const allProducts = aggregateProductStock(slots, salesByProduct);
    const uniqueBrands = extractUniqueBrands(slots);
    
    // Cria lista de sugestões para autocomplete
    const productSuggestions = allProducts.map(p => ({
      productKey: p.productKey,
      brand: p.brand,
      model: p.model,
      totalSold: p.totalSold,
    })).sort((a, b) => b.totalSold - a.totalSold); // Ordena por vendas
    
    // Aplica filtros nos produtos (para tabela)
    let filtered = allProducts;
    let slotsFiltered: SlotData[] = slots;
    
    // Filtro de busca por modelo (compartilhado)
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase().trim();
      const exactModelMatch = productSuggestions.some(s => 
        s.model.toLowerCase().trim() === term
      );
      
      filtered = filtered.filter(p => 
        matchesSearchFilter(term, p.productName, p.model, exactModelMatch)
      );
      slotsFiltered = slotsFiltered.filter(s => 
        matchesSearchFilter(term, s.productName, s.model, exactModelMatch)
      );
    }
    
    // Filtro por marca
    if (filters.brandFilter && filters.brandFilter !== 'all') {
      filtered = filtered.filter(p => p.brand === filters.brandFilter);
      slotsFiltered = slotsFiltered.filter(s => s.brand === filters.brandFilter);
    }
    
    // Filtro por status
    if (filters.statusFilter && filters.statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === filters.statusFilter);
      slotsFiltered = slotsFiltered.filter(s => getProductActionStatus(s.quantity) === filters.statusFilter);
    }
    
    // Filtro por índice de vendas
    if (filters.salesIndexFilter && filters.salesIndexFilter !== 'all') {
      filtered = filtered.filter(p => p.salesIndex === filters.salesIndexFilter);
      slotsFiltered = slotsFiltered.filter(s => {
        const productSold = salesByProduct.get(s.productName) || 0;
        return getSalesIndex(productSold) === filters.salesIndexFilter;
      });
    }
    
    // Calcula total de slots disponíveis na máquina
    const totalSlots = GRID_LAYOUT.reduce((acc, floor) => 
      acc + floor.slots.filter(s => s !== null).length, 0
    );
    
    return {
      products: filtered,
      kpis: calculateStockKPIs(allProducts, totalSlots),
      brands: uniqueBrands,
      suggestions: productSuggestions,
      filteredSlots: slotsFiltered,
    };
  }, [slots, salesByProduct, filters.searchTerm, filters.brandFilter, filters.statusFilter, filters.salesIndexFilter]);
  
  const refetch = async () => {
    await Promise.all([refetchSlots(), refetchSales()]);
  };
  
  return {
    products,
    kpis,
    brands,
    slots,
    filteredSlots,
    suggestions,
    isLoading: slotsLoading || salesLoading,
    isFetching: slotsFetching || salesFetching,
    refetch,
  };
}
