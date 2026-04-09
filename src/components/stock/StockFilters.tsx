import { useStockFilters } from '@/contexts/StockFiltersContext';
import { usePDVs } from '@/hooks/usePDVs';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { KNOWN_BRANDS } from '@/lib/brandAssets';
import { ProductSearchAutocomplete, ProductSuggestion } from './ProductSearchAutocomplete';
import { PDVFilter } from '@/components/ui/PDVFilter';
import { FilterBar } from '@/components/ui/FilterBar';
import { SelectFilter, type SelectFilterOption } from '@/components/ui/SelectFilter';
import { useMemo, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const STATUS_OPTIONS: SelectFilterOption[] = [
  { value: 'all', label: 'Todos os status' },
  { value: 'perfect', label: 'Perfeito', icon: <span className="w-2 h-2 rounded-full bg-green-500" /> },
  { value: 'monitor', label: 'Acompanhar', icon: <span className="w-2 h-2 rounded-full bg-blue-500" /> },
  { value: 'warning', label: 'Atenção', icon: <span className="w-2 h-2 rounded-full bg-orange-500" /> },
  { value: 'restock', label: 'Repor', icon: <span className="w-2 h-2 rounded-full bg-destructive" /> },
];

const SALES_INDEX_OPTIONS: SelectFilterOption[] = [
  { value: 'all', label: 'Todas as vendas' },
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Média' },
  { value: 'low', label: 'Baixa' },
  { value: 'none', label: 'Nenhuma' },
];


interface StockFiltersProps {
  brands?: string[];
  suggestions?: ProductSuggestion[];
}

export function StockFilters({ brands = KNOWN_BRANDS, suggestions = [] }: StockFiltersProps) {
  const {
    selectedPdv,
    searchTerm,
    brandFilter,
    statusFilter,
    salesIndexFilter,
    setSelectedPdv,
    setSearchTerm,
    setBrandFilter,
    setStatusFilter,
    setSalesIndexFilter,
    clearFilters,
    hasActiveFilters,
    pdvWasAutoApplied,
  } = useStockFilters();
  
  const { pdvs = [] } = usePDVs();

  const brandOptions = useMemo<SelectFilterOption[]>(() => [
    { value: 'all', label: 'Todas as marcas' },
    ...brands.map((brand) => ({
      value: brand,
      label: brand,
      icon: <BrandLogo brand={brand} size="xs" showTooltip={false} />,
    })),
  ], [brands]);

  const isMobile = useIsMobile();
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);

  const secondaryFilterCount = [
    brandFilter !== 'all' ? 1 : 0,
    statusFilter !== 'all' ? 1 : 0,
    salesIndexFilter !== 'all' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const secondaryFilters = (
    <>
      <SelectFilter
        value={brandFilter}
        onChange={setBrandFilter}
        placeholder="Marca"
        options={brandOptions}
        triggerClassName="w-full sm:w-[160px]"
      />
      <SelectFilter
        value={statusFilter}
        onChange={setStatusFilter}
        placeholder="Status"
        options={STATUS_OPTIONS}
        triggerClassName="w-full sm:w-[150px]"
      />
      <SelectFilter
        value={salesIndexFilter}
        onChange={setSalesIndexFilter}
        placeholder="Vendas"
        options={SALES_INDEX_OPTIONS}
        triggerClassName="w-full sm:w-[140px]"
        testId="sales-index-filter"
      />
    </>
  );

  return (
    <FilterBar hasActiveFilters={hasActiveFilters} onClear={clearFilters}>
      {/* PDV Select */}
      <PDVFilter
        value={selectedPdv}
        onChange={setSelectedPdv}
        pdvs={pdvs}
        showAutoAppliedBadge={pdvWasAutoApplied}
      />

      {/* Search with Autocomplete */}
      <div className="w-full sm:w-auto sm:flex-1 sm:max-w-xs" data-testid="search-autocomplete">
        <ProductSearchAutocomplete
          suggestions={suggestions}
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar modelo..."
        />
      </div>

      {/* Secondary filters: collapsible on mobile, inline on desktop */}
      {isMobile ? (
        <Collapsible open={moreFiltersOpen} onOpenChange={setMoreFiltersOpen} className="w-full">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full h-9 justify-between">
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Mais filtros
                {secondaryFilterCount > 0 && (
                  <Badge variant="secondary" className="h-5 min-w-[20px] px-1.5 text-[10px]">
                    {secondaryFilterCount}
                  </Badge>
                )}
              </span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${moreFiltersOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            {secondaryFilters}
          </CollapsibleContent>
        </Collapsible>
      ) : (
        secondaryFilters
      )}
    </FilterBar>
  );
}
