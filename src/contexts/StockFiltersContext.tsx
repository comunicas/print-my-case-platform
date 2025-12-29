import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePreferences } from '@/hooks/usePreferences';
import { usePDVs } from '@/hooks/usePDVs';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [hasInitializedPrefs, setHasInitializedPrefs] = useState(false);
  const [state, setState] = useState<StockFiltersState>(defaultState);
  const [pdvWasAutoApplied, setPdvWasAutoApplied] = useState(false);

  // Apply default_pdv preference on first load
  useEffect(() => {
    if (preferences && !hasInitializedPrefs && !isLoadingPreferences && !isLoadingPdvs) {
      if (preferences.default_pdv) {
        // Validate that the PDV exists
        const pdv = pdvs.find(p => p.id === preferences.default_pdv);
        if (pdv) {
          setState(s => ({ ...s, selectedPdv: preferences.default_pdv! }));
          setPdvWasAutoApplied(true);
          
          // Show toast only once per session
          if (!sessionStorage.getItem(AUTO_APPLIED_TOAST_KEY)) {
            toast({
              title: "Preferências aplicadas",
              description: `PDV "${pdv.name}" foi selecionado automaticamente.`,
              duration: 4000,
            });
            sessionStorage.setItem(AUTO_APPLIED_TOAST_KEY, 'true');
          }
        }
      }
      setHasInitializedPrefs(true);
    }
  }, [preferences, hasInitializedPrefs, isLoadingPreferences, isLoadingPdvs, pdvs, toast]);

  const setSelectedPdv = (pdv: string) => {
    setState(s => ({ ...s, selectedPdv: pdv }));
    setPdvWasAutoApplied(false);
  };
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
