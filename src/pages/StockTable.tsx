import { useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Loader2, Table as TableIcon, LayoutGrid } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StockFiltersProvider } from "@/contexts/StockFiltersContext";
import { StockFilters } from "@/components/stock/StockFilters";
import { ProductStockTable } from "@/components/stock/ProductStockTable";
import { StockGridView } from "@/components/stock/StockGridView";
import { StockEmptyState } from "@/components/stock/StockEmptyState";
import { useProductStock } from "@/hooks/useProductStock";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function StockTableContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const { products, kpis, globalKpis, brands, slots, filteredSlots, suggestions, isLoading, isFetching, refetch } = useProductStock();

  const viewParam = searchParams.get("view");
  const [viewMode, setViewMode] = useState<'table' | 'map'>(viewParam === 'map' ? 'map' : 'table');

  // Sync view mode from URL
  useEffect(() => {
    if (viewParam === 'map') setViewMode('map');
    else if (viewParam === 'table' || !viewParam) setViewMode('table');
  }, [viewParam]);

  const handleViewChange = (mode: 'table' | 'map') => {
    setViewMode(mode);
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (mode === 'map') {
        newParams.set('view', 'map');
      } else {
        newParams.delete('view');
      }
      return newParams;
    });
  };

  const handleRefresh = async () => {
    await refetch();
    toast.success("Estoque atualizado!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasData = slots.length > 0;

  const content = (
    <div data-testid="stock-content" className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            {viewMode === 'table' ? 'Tabela de Estoque' : 'Mapa de Slots'}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {viewMode === 'table' ? 'Detalhes do inventário por produto' : 'Visualização dos slots das máquinas'}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-3 gap-1.5",
              viewMode === 'table' && "bg-background shadow-sm"
            )}
            onClick={() => handleViewChange('table')}
          >
            <TableIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Tabela</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-3 gap-1.5",
              viewMode === 'map' && "bg-background shadow-sm"
            )}
            onClick={() => handleViewChange('map')}
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Mapa</span>
          </Button>
        </div>
      </div>

      {!hasData ? (
        <StockEmptyState />
      ) : (
        <div className="space-y-4">
          <StockFilters brands={brands} suggestions={suggestions} />
          
          {viewMode === 'table' ? (
            <ProductStockTable products={products} isLoading={isLoading} />
          ) : (
            <StockGridView slots={slots} filteredSlots={filteredSlots} brands={brands} isLoading={isLoading} />
          )}
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <PullToRefresh onRefresh={handleRefresh} isRefreshing={isFetching} disabled={isLoading}>
        {content}
      </PullToRefresh>
    );
  }

  return content;
}

export default function StockTablePage() {
  return (
    <AppLayout>
      <StockFiltersProvider>
        <StockTableContent />
      </StockFiltersProvider>
    </AppLayout>
  );
}
