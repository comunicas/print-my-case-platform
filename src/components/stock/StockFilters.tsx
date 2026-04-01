import { useStockFilters } from '@/contexts/StockFiltersContext';
import { usePDVs } from '@/hooks/usePDVs';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { KNOWN_BRANDS } from '@/lib/brandAssets';
import { ProductSearchAutocomplete, ProductSuggestion } from './ProductSearchAutocomplete';
import { PDVFilter } from '@/components/ui/PDVFilter';
import { FilterBar } from '@/components/ui/FilterBar';
import { SelectFilter, type SelectFilterOption } from '@/components/ui/SelectFilter';
import { useMemo } from 'react';

const STATUS_OPTIONS: SelectFilterOption[] = [
  { value: 'all', label: 'Todos os status' },
  { value: 'ok', label: 'Ok', icon: <span className="w-2 h-2 rounded-full bg-green-500" /> },
  { value: 'redistribute', label: 'Redistribuir', icon: <span className="w-2 h-2 rounded-full bg-orange-500" /> },
  { value: 'restock', label: 'Repor', icon: <span className="w-2 h-2 rounded-full bg-destructive" /> },
];

const SALES_INDEX_OPTIONS: SelectFilterOption[] = [
  { value: 'all', label: 'Todas as vendas' },
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Média' },
  { value: 'low', label: 'Baixa' },
  { value: 'none', label: 'Nenhuma' },
];

const SALE_STATUS_OPTIONS: SelectFilterOption[] = [
  { value: 'completed', label: 'Concluídas', icon: <span className="w-2 h-2 rounded-full bg-green-500" /> },
  { value: 'cancelled', label: 'Canceladas', icon: <span className="w-2 h-2 rounded-full bg-destructive" /> },
  { value: 'refunded', label: 'Reembolsadas', icon: <span className="w-2 h-2 rounded-full bg-orange-500" /> },
  { value: 'all', label: 'Todas', icon: <span className="w-2 h-2 rounded-full bg-muted-foreground" /> },
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
    saleStatusFilter,
    setSelectedPdv,
    setSearchTerm,
    setBrandFilter,
    setStatusFilter,
    setSalesIndexFilter,
    setSaleStatusFilter,
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

  // Arrays estáticos movidos para fora do componente (STATUS_OPTIONS, etc.)

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

      {/* Brand Filter */}
      <SelectFilter
        value={brandFilter}
        onChange={setBrandFilter}
        placeholder="Marca"
        options={brandOptions}
        triggerClassName="w-full sm:w-[160px]"
      />

      {/* Status Filter */}
      <SelectFilter
        value={statusFilter}
        onChange={setStatusFilter}
        placeholder="Status"
        options={STATUS_OPTIONS}
        triggerClassName="w-full sm:w-[150px]"
      />

      {/* Sales Index Filter */}
      <SelectFilter
        value={salesIndexFilter}
        onChange={setSalesIndexFilter}
        placeholder="Vendas"
        options={SALES_INDEX_OPTIONS}
        triggerClassName="w-full sm:w-[140px]"
        testId="sales-index-filter"
      />

      {/* Sale Status Filter */}
      <div className="flex items-center gap-1">
        <SelectFilter
          value={saleStatusFilter}
          onChange={(v) => setSaleStatusFilter(v as SaleStatusFilter)}
          placeholder="Status venda"
          options={SALE_STATUS_OPTIONS}
          triggerClassName="w-full sm:w-[160px]"
          testId="sale-status-filter"
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help flex-shrink-0" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-xs">
                <strong>Padrão: Concluídas.</strong> Filtra quais vendas são usadas para calcular o índice de vendas de cada produto. 
                Cancelamentos e reembolsos são excluídos do cálculo por padrão.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </FilterBar>
  );
}
