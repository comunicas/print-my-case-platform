import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StockFiltersProvider } from "@/contexts/StockFiltersContext";
import { StockKPICards } from "@/components/stock/StockKPICards";
import { StockFilters } from "@/components/stock/StockFilters";
import { ProductStockTable } from "@/components/stock/ProductStockTable";
import { StockGridView } from "@/components/stock/StockGridView";
import { StockEmptyState } from "@/components/stock/StockEmptyState";
import { PDVDataTab } from "@/components/stock/PDVDataTab";
import { useProductStock } from "@/hooks/useProductStock";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

const VALID_TABS = ["tabela", "mapa", "dados"] as const;

function StockContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const currentTab = searchParams.get("tab") || "tabela";
  const activeTab = VALID_TABS.includes(currentTab as typeof VALID_TABS[number]) 
    ? currentTab 
    : "tabela";

  const handleTabChange = (value: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set("tab", value);
      return newParams;
    });
  };

  const isMobile = useIsMobile();
  const { products, kpis, globalKpis, brands, slots, filteredSlots, suggestions, isLoading, isFetching, refetch } = useProductStock();

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
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">Estoque</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Gestão de inventário das suas máquinas
        </p>
      </div>

      <StockKPICards kpis={kpis} globalKpis={globalKpis} isLoading={isLoading} />

      {!hasData ? (
        <StockEmptyState />
      ) : (
        <div className="space-y-6">
          {/* Filtros compartilhados entre as tabs */}
          <StockFilters brands={brands} suggestions={suggestions} />

          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="tabela">Tabela</TabsTrigger>
              <TabsTrigger value="mapa">Mapa</TabsTrigger>
            </TabsList>

            <TabsContent value="tabela" className="mt-4">
              <ProductStockTable products={products} allSlots={slots} isLoading={isLoading} />
            </TabsContent>

            <TabsContent value="mapa" className="mt-4">
              <StockGridView slots={slots} filteredSlots={filteredSlots} brands={brands} isLoading={isLoading} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <PullToRefresh 
        onRefresh={handleRefresh} 
        isRefreshing={isFetching}
        disabled={isLoading}
      >
        {content}
      </PullToRefresh>
    );
  }

  return content;
}

export default function Stock() {
  return (
    <AppLayout>
      <StockFiltersProvider>
        <StockContent />
      </StockFiltersProvider>
    </AppLayout>
  );
}
