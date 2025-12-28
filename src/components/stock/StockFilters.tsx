import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
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

interface StockFiltersProps {
  brands?: string[];
}

export function StockFilters({ brands = KNOWN_BRANDS }: StockFiltersProps) {
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
  } = useStockFilters();
  
  const { pdvs = [] } = usePDVs();

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* PDV Select */}
      <Select value={selectedPdv} onValueChange={setSelectedPdv}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Selecionar PDV" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os PDVs</SelectItem>
          {pdvs.map((pdv) => (
            <SelectItem key={pdv.id} value={pdv.id}>
              {pdv.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-[300px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar modelo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Brand Filter */}
      <Select value={brandFilter} onValueChange={setBrandFilter}>
        <SelectTrigger className="w-[160px]">
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
        <SelectTrigger className="w-[150px]">
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
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Vendas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas vendas</SelectItem>
          <SelectItem value="high">Alta</SelectItem>
          <SelectItem value="medium">Média</SelectItem>
          <SelectItem value="low">Baixa</SelectItem>
          <SelectItem value="none">Nenhuma</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  );
}
