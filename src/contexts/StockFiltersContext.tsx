import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePreferences } from '@/hooks/usePreferences';
import { usePDVs } from '@/hooks/usePDVs';
import { toast } from 'sonner';

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
  pdvWasAutoApplied: boolean;
}

const defaultState: StockFiltersState = {
  selectedPdv: 'all',
  searchTerm: '',
  brandFilter: 'all',
  statusFilter: 'all',
  salesIndexFilter: 'all',
};

const StockFiltersContext = createContext<StockFiltersContextType | undefined>(undefined);

const AUTO_APPLIED_TOAST_KEY = 'pdv_auto_applied_toast_shown';

export function StockFiltersProvider({ children }: { children: ReactNode }) {
  const { preferences, isLoading: isLoadingPreferences } = usePreferences();
  const { pdvs = [], isLoading: isLoadingPdvs } = usePDVs();
  const [state, setState] = useState<StockFiltersState>(defaultState);
  const [pdvWasAutoApplied, setPdvWasAutoApplied] = useState(false);
  const [prefsInitialized, setPrefsInitialized] = useState(false);

  // Apply default_pdv preference on first load
  useEffect(() => {
    if (prefsInitialized || isLoadingPreferences || isLoadingPdvs) return;
    if (preferences === undefined) return;
    
    setPrefsInitialized(true);
    
    if (preferences?.default_pdv) {
      const pdv = pdvs.find(p => p.id === preferences.default_pdv);
      if (pdv) {
        setState(s => ({ ...s, selectedPdv: preferences.default_pdv! }));
        setPdvWasAutoApplied(true);
        
        if (!sessionStorage.getItem(AUTO_APPLIED_TOAST_KEY)) {
          toast.info("Preferências aplicadas", {
            description: `PDV "${pdv.name}" foi selecionado automaticamente.`,
            duration: 4000,
          });
          sessionStorage.setItem(AUTO_APPLIED_TOAST_KEY, 'true');
        }
      }
    }
  }, [preferences, prefsInitialized, isLoadingPreferences, isLoadingPdvs, pdvs]);

  const setSelectedPdv = (pdv: string) => {
    setState(s => ({ ...s, selectedPdv: pdv }));
    setPdvWasAutoApplied(false);
  };
  const setSearchTerm = (term: string) => setState(s => ({ ...s, searchTerm: term }));
  const setBrandFilter = (brand: string) => setState(s => ({ ...s, brandFilter: brand }));
  const setStatusFilter = (status: string) => setState(s => ({ ...s, statusFilter: status }));
  const setSalesIndexFilter = (index: string) => setState(s => ({ ...s, salesIndexFilter: index }));
  const setSaleStatusFilter = (status: SaleStatusFilter) => setState(s => ({ ...s, saleStatusFilter: status }));
  
  const clearFilters = () => setState(defaultState);
  
  const hasActiveFilters = 
    state.searchTerm !== '' ||
    state.brandFilter !== 'all' ||
    state.statusFilter !== 'all' ||
    state.salesIndexFilter !== 'all' ||
    state.saleStatusFilter !== 'completed';

  return (
    <StockFiltersContext.Provider value={{
      ...state,
      setSelectedPdv,
      setSearchTerm,
      setBrandFilter,
      setStatusFilter,
      setSalesIndexFilter,
      setSaleStatusFilter,
      clearFilters,
      hasActiveFilters,
      pdvWasAutoApplied,
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

// Hook seguro para uso fora do provider (como em prefetch)
export function useStockFiltersOptional() {
  const context = useContext(StockFiltersContext);
  return context ?? {
    selectedPdv: 'all',
    searchTerm: '',
    brandFilter: 'all',
    statusFilter: 'all',
    salesIndexFilter: 'all',
    saleStatusFilter: 'completed' as SaleStatusFilter,
    setSelectedPdv: () => {},
    setSearchTerm: () => {},
    setBrandFilter: () => {},
    setStatusFilter: () => {},
    setSalesIndexFilter: () => {},
    setSaleStatusFilter: () => {},
    clearFilters: () => {},
    hasActiveFilters: false,
    pdvWasAutoApplied: false,
  };
}
