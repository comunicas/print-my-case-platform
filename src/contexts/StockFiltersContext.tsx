import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePreferences } from '@/hooks/usePreferences';

interface StockFiltersState {
  selectedPdv: string;
  searchTerm: string;
  brandFilter: string;
  statusFilter: string;
  salesIndexFilter: string;
}

interface StockFiltersContextType extends StockFiltersState {
  setSelectedPdv: (pdv: string) => void;
  setSearchTerm: (term: string) => void;
  setBrandFilter: (brand: string) => void;
  setStatusFilter: (status: string) => void;
  setSalesIndexFilter: (index: string) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

const defaultState: StockFiltersState = {
  selectedPdv: 'all',
  searchTerm: '',
  brandFilter: 'all',
  statusFilter: 'all',
  salesIndexFilter: 'all',
};

const StockFiltersContext = createContext<StockFiltersContextType | undefined>(undefined);

export function StockFiltersProvider({ children }: { children: ReactNode }) {
  const { preferences, isLoading: isLoadingPreferences } = usePreferences();
  const [hasInitializedPrefs, setHasInitializedPrefs] = useState(false);
  const [state, setState] = useState<StockFiltersState>(defaultState);

  // Apply default_pdv preference on first load
  useEffect(() => {
    if (preferences && !hasInitializedPrefs && !isLoadingPreferences) {
      if (preferences.default_pdv) {
        setState(s => ({ ...s, selectedPdv: preferences.default_pdv! }));
      }
      setHasInitializedPrefs(true);
    }
  }, [preferences, hasInitializedPrefs, isLoadingPreferences]);

  const setSelectedPdv = (pdv: string) => setState(s => ({ ...s, selectedPdv: pdv }));
  const setSearchTerm = (term: string) => setState(s => ({ ...s, searchTerm: term }));
  const setBrandFilter = (brand: string) => setState(s => ({ ...s, brandFilter: brand }));
  const setStatusFilter = (status: string) => setState(s => ({ ...s, statusFilter: status }));
  const setSalesIndexFilter = (index: string) => setState(s => ({ ...s, salesIndexFilter: index }));
  
  const clearFilters = () => setState(defaultState);
  
  const hasActiveFilters = 
    state.searchTerm !== '' ||
    state.brandFilter !== 'all' ||
    state.statusFilter !== 'all' ||
    state.salesIndexFilter !== 'all';

  return (
    <StockFiltersContext.Provider value={{
      ...state,
      setSelectedPdv,
      setSearchTerm,
      setBrandFilter,
      setStatusFilter,
      setSalesIndexFilter,
      clearFilters,
      hasActiveFilters,
    }}>
      {children}
    </StockFiltersContext.Provider>
  );
}

export function useStockFilters() {
  const context = useContext(StockFiltersContext);
  if (!context) {
    throw new Error('useStockFilters must be used within a StockFiltersProvider');
  }
  return context;
}
