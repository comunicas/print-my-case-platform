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
import { useProductStock } from "@/hooks/useProductStock";

const VALID_TABS = ["tabela", "mapa"] as const;

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

  const { products, kpis, brands, slots, suggestions, isLoading } = useProductStock();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasData = slots.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Estoque</h1>
        <p className="text-muted-foreground">
          Gestão de inventário das suas máquinas
        </p>
      </div>

      <StockKPICards kpis={kpis} isLoading={isLoading} />

      {!hasData ? (
        <StockEmptyState />
      ) : (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList>
            <TabsTrigger value="tabela">Tabela</TabsTrigger>
            <TabsTrigger value="mapa">Mapa</TabsTrigger>
          </TabsList>

          <TabsContent value="tabela" className="space-y-4">
            <StockFilters brands={brands} suggestions={suggestions} />
            <ProductStockTable products={products} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="mapa">
            <StockGridView slots={slots} brands={brands} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
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
