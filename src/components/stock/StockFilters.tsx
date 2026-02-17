import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStockFilters } from '@/contexts/StockFiltersContext';
import { usePDVs } from '@/hooks/usePDVs';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { KNOWN_BRANDS } from '@/lib/brandAssets';
import { ProductSearchAutocomplete, ProductSuggestion } from './ProductSearchAutocomplete';
import { PDVFilter } from '@/components/ui/PDVFilter';

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

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 items-stretch sm:items-center">
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
      <Select value={brandFilter} onValueChange={setBrandFilter}>
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Marca" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as marcas</SelectItem>
          {brands.map((brand) => (
            <SelectItem key={brand} value={brand}>
              <div className="flex items-center gap-2">
                <BrandLogo brand={brand} size="xs" showTooltip={false} />
                <span>{brand}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-full sm:w-[150px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os status</SelectItem>
          <SelectItem value="ok">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Ok
            </span>
          </SelectItem>
          <SelectItem value="redistribute">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              Redistribuir
            </span>
          </SelectItem>
          <SelectItem value="restock">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-destructive" />
              Repor
            </span>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Sales Index Filter */}
      <Select value={salesIndexFilter} onValueChange={setSalesIndexFilter}>
        <SelectTrigger className="w-full sm:w-[140px]" data-testid="sales-index-filter">
          <SelectValue placeholder="Vendas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as vendas</SelectItem>
          <SelectItem value="high">Alta</SelectItem>
          <SelectItem value="medium">Média</SelectItem>
          <SelectItem value="low">Baixa</SelectItem>
          <SelectItem value="none">Nenhuma</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full sm:w-auto" data-testid="clear-filters">
          <X className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  );
}
