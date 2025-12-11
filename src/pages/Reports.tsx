import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesUnitReport } from "@/components/reports/SalesUnitReport";
import { MonthlySalesReport } from "@/components/reports/MonthlySalesReport";
import { ProductsReport } from "@/components/reports/ProductsReport";
import { StockHealthReport } from "@/components/reports/StockHealthReport";

export default function Reports() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">
            Análises detalhadas do desempenho das suas máquinas
          </p>
        </div>

        <Tabs defaultValue="unit" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="unit">Vendas por Unidade</TabsTrigger>
            <TabsTrigger value="monthly">Vendas Mensal</TabsTrigger>
            <TabsTrigger value="products">Análise de Produtos</TabsTrigger>
            <TabsTrigger value="stock">Saúde do Estoque</TabsTrigger>
          </TabsList>

          <TabsContent value="unit">
            <SalesUnitReport />
          </TabsContent>

          <TabsContent value="monthly">
            <MonthlySalesReport />
          </TabsContent>

          <TabsContent value="products">
            <ProductsReport />
          </TabsContent>

          <TabsContent value="stock">
            <StockHealthReport />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
