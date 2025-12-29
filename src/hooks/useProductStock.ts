import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSlotsData } from './useSlotsData';
import { useStockFilters } from '@/contexts/StockFiltersContext';
import { useProfile } from './useProfile';
import { 
  ProductStock, 
  StockKPIs, 
  SlotData,
  aggregateProductStock, 
  calculateStockKPIs,
  extractUniqueBrands,
  getSalesIndex,
} from '@/lib/stockUtils';
import { GRID_LAYOUT } from '@/lib/stockGridUtils';
import type { ProductSuggestion } from '@/components/stock/ProductSearchAutocomplete';

// Helper para calcular status de um slot individual
function getSlotStatus(quantity: number): 'ok' | 'redistribute' | 'restock' {
  if (quantity <= 2) return 'restock';
  if (quantity <= 5) return 'redistribute';
  return 'ok';
}

export function useProductStock() {
  const filters = useStockFilters();
  const { profile } = useProfile();
  
  const { data: slots = [], isLoading: slotsLoading } = useSlotsData({ 
    pdvId: filters.selectedPdv,
    userId: profile?.id,
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
    staleTime: 5 * 60 * 1000, // 5 minutos
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
    
    // Filtro de busca por modelo
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase().trim();
      
      // Verifica se o termo corresponde exatamente a algum modelo existente (seleção do autocomplete)
      const exactModelMatch = productSuggestions.some(s => 
        s.model.toLowerCase().trim() === term
      );
      
      filtered = filtered.filter(p => {
        const modelLower = p.model.toLowerCase().trim();
        const productLower = p.productName.toLowerCase().trim();
        
        if (exactModelMatch) {
          // Match exato - usuário selecionou um produto específico
          return modelLower === term || productLower === term;
        } else {
          // Match parcial - usuário está digitando
          return modelLower.includes(term) || productLower.includes(term);
        }
      });
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
    
    // Aplica filtros nos slots (para mapa) - mesma lógica
    let slotsFiltered: SlotData[] = slots;
    
    // Filtro de busca por modelo
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase().trim();
      
      // Verifica se o termo corresponde exatamente a algum modelo existente
      const exactModelMatch = productSuggestions.some(s => 
        s.model.toLowerCase().trim() === term
      );
      
      slotsFiltered = slotsFiltered.filter(s => {
        const modelLower = s.model.toLowerCase().trim();
        const productLower = s.productName.toLowerCase().trim();
        
        if (exactModelMatch) {
          // Match exato
          return modelLower === term || productLower === term;
        } else {
          // Match parcial
          return modelLower.includes(term) || productLower.includes(term);
        }
      });
    }
    
    // Filtro por marca
    if (filters.brandFilter && filters.brandFilter !== 'all') {
      slotsFiltered = slotsFiltered.filter(s => s.brand === filters.brandFilter);
    }
    
    // Filtro por status (baseado em quantidade do slot)
    if (filters.statusFilter && filters.statusFilter !== 'all') {
      slotsFiltered = slotsFiltered.filter(s => getSlotStatus(s.quantity) === filters.statusFilter);
    }
    
    // Filtro por índice de vendas (baseado nas vendas do produto)
    if (filters.salesIndexFilter && filters.salesIndexFilter !== 'all') {
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
  }, [slots, salesByProduct, filters]);
  
  return {
    products,
    kpis,
    brands,
    slots,
    filteredSlots,
    suggestions,
    isLoading: slotsLoading || salesLoading,
  };
}
