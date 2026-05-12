import { useNavigate } from "react-router-dom";
import { Loader2, ArrowRight, AlertTriangle, Eye } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StockFiltersProvider } from "@/contexts/StockFiltersContext";
import { StockKPICards } from "@/components/stock/StockKPICards";
import { StockEmptyState } from "@/components/stock/StockEmptyState";
import { useProductStock } from "@/hooks/useProductStock";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { toast } from "sonner";

function StockOverviewContent() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { products, kpis, globalKpis, slots, isLoading, isFetching, refetch } = useProductStock();

  const handleRefresh = async () => {
    await refetch();
    toast.success("Estoque atualizado!");
  };

  const handleKPIClick = (filter: string) => {
    navigate(`/estoque/tabela?status=${filter}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasData = slots.length > 0;

  // Top products to restock (quantity 0)
  const restockProducts = products
    .filter(p => p.status === 'restock')
    .sort((a, b) => a.totalQuantity - b.totalQuantity)
    .slice(0, 5);

  // Low stock products (warning)
  const warningProducts = products
    .filter(p => p.status === 'warning')
    .sort((a, b) => a.totalQuantity - b.totalQuantity)
    .slice(0, 5);

  const content = (
    <div data-testid="stock-content" className="ds-screen-enter space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Estoque</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Visão geral do inventário
          </p>
        </div>
        
      </div>

      <StockKPICards 
        kpis={kpis} 
        globalKpis={globalKpis} 
        isLoading={isLoading} 
        onCardClick={handleKPIClick}
      />

      {!hasData ? (
        <StockEmptyState />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Produtos para Repor */}
          {restockProducts.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    Produtos para Repor
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs gap-1"
                    onClick={() => navigate('/estoque/tabela?status=restock')}
                  >
                    Ver todos <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {restockProducts.map((product) => (
                  <div
                    key={product.productKey}
                    className="flex items-center justify-between p-2 rounded-lg bg-destructive/5 border border-destructive/10"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <BrandLogo brand={product.brand} size="sm" />
                      <span className="text-sm font-medium truncate">{product.model}</span>
                    </div>
                    <Badge variant="destructive" className="text-xs shrink-0">
                      {product.slots.length} {product.slots.length === 1 ? 'slot' : 'slots'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Produtos em Atenção */}
          {warningProducts.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="h-4 w-4 text-orange-500" />
                    Estoque Baixo
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs gap-1"
                    onClick={() => navigate('/estoque/tabela?status=warning')}
                  >
                    Ver todos <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {warningProducts.map((product) => (
                  <div
                    key={product.productKey}
                    className="flex items-center justify-between p-2 rounded-lg bg-orange-500/5 border border-orange-500/10"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <BrandLogo brand={product.brand} size="sm" />
                      <span className="text-sm font-medium truncate">{product.model}</span>
                    </div>
                    <Badge className="text-xs shrink-0 bg-orange-500/10 text-orange-600 border-orange-500/20">
                      {product.totalQuantity} un.
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quick Links */}
          <Card className={restockProducts.length === 0 && warningProducts.length === 0 ? "md:col-span-2" : ""}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Acesso Rápido</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-1"
                onClick={() => navigate('/estoque/tabela')}
              >
                <span className="text-sm font-medium">Tabela</span>
                <span className="text-xs text-muted-foreground">Ver detalhes</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-1"
                onClick={() => navigate('/estoque/tabela?view=map')}
              >
                <span className="text-sm font-medium">Mapa</span>
                <span className="text-xs text-muted-foreground">Visualizar slots</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-1 col-span-2"
                onClick={() => navigate('/estoque/compras')}
              >
                <span className="text-sm font-medium">Compras</span>
                <span className="text-xs text-muted-foreground">Gerenciar pedidos</span>
              </Button>
            </CardContent>
          </Card>
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

export default function StockOverview() {
  return (
    <AppLayout>
      <StockFiltersProvider>
        <StockOverviewContent />
      </StockFiltersProvider>
    </AppLayout>
  );
}
