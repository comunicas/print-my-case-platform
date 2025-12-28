import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSlotsData } from './useSlotsData';
import { useStockFilters } from '@/contexts/StockFiltersContext';
import { 
  ProductStock, 
  StockKPIs, 
  aggregateProductStock, 
  calculateStockKPIs,
  extractUniqueBrands,
} from '@/lib/stockUtils';
import { GRID_LAYOUT } from '@/lib/stockGridUtils';
import type { ProductSuggestion } from '@/components/stock/ProductSearchAutocomplete';

export function useProductStock() {
  const filters = useStockFilters();
  const { data: slots = [], isLoading: slotsLoading } = useSlotsData({ 
    pdvId: filters.selectedPdv 
  });
  
  // Busca dados de vendas para calcular índice
  const { data: salesData = [], isLoading: salesLoading } = useQuery({
    queryKey: ['sales-summary', filters.selectedPdv],
    queryFn: async () => {
      let query = supabase
        .from('sales_records')
        .select('product_name, pdv_id');
      
      if (filters.selectedPdv && filters.selectedPdv !== 'all') {
        query = query.eq('pdv_id', filters.selectedPdv);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
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
  const { products, kpis, brands, suggestions } = useMemo(() => {
    const allProducts = aggregateProductStock(slots, salesByProduct);
    const uniqueBrands = extractUniqueBrands(slots);
    
    // Cria lista de sugestões para autocomplete
    const productSuggestions = allProducts.map(p => ({
      productKey: p.productKey,
      brand: p.brand,
      model: p.model,
      totalSold: p.totalSold,
    })).sort((a, b) => b.totalSold - a.totalSold); // Ordena por vendas
    
    // Aplica filtros
    let filtered = allProducts;
    
    // Filtro de busca por modelo
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.model.toLowerCase().includes(term) ||
        p.productName.toLowerCase().includes(term)
      );
    }
    
    // Filtro por marca
    if (filters.brandFilter && filters.brandFilter !== 'all') {
      filtered = filtered.filter(p => p.brand === filters.brandFilter);
    }
    
    // Filtro por status
    if (filters.statusFilter && filters.statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === filters.statusFilter);
    }
    
    // Filtro por índice de vendas
    if (filters.salesIndexFilter && filters.salesIndexFilter !== 'all') {
      filtered = filtered.filter(p => p.salesIndex === filters.salesIndexFilter);
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
    };
  }, [slots, salesByProduct, filters]);
  
  return {
    products,
    kpis,
    brands,
    slots,
    suggestions,
    isLoading: slotsLoading || salesLoading,
  };
}
