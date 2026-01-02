import { Download, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import { TopProductData, exportToExcel } from "@/lib/dashboardUtils";
import { formatCurrency } from "@/lib/utils";
import { getBrandChartColor } from "@/lib/brandAssets";
import { useProductModal } from "@/contexts/ProductModalContext";
import { getExactProductKey } from "@/lib/productNormalization";

interface TopProductsChartProps {
  data: TopProductData[];
}

const chartConfig = {
  revenue: { label: "Receita" },
};

export function TopProductsChart({ data }: TopProductsChartProps) {
  const { openProductModal } = useProductModal();
  
  const handleExport = () => {
    exportToExcel(
      data.map((d, idx) => ({
        Posição: idx + 1,
        Produto: d.name,
        Marca: d.brand,
        Receita: d.revenue,
        Quantidade: d.count,
      })),
      "top-produtos"
    );
  };
  
  const truncateName = (name: string, maxLength: number = 20) => {
    return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name;
  };

  return (
    <Card data-testid="top-products-chart" className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between px-4 md:px-6 pt-4 md:pt-6 pb-3">
        <CardTitle className="text-base md:text-lg">Top 10 Produtos</CardTitle>
        <Button data-testid="export-top-products" variant="ghost" size="sm" onClick={handleExport} className="gap-1.5">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Exportar</span>
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col px-4 md:px-6 pb-4 md:pb-6">
        {data.length > 0 ? (
          <ChartContainer config={chartConfig} className="flex-1 min-h-[300px] w-full">
            <BarChart 
              data={data} 
              layout="vertical" 
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                type="number" 
                className="text-xs" 
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => formatCurrency(value).replace("R$", "").trim()}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                className="text-xs" 
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                width={120}
                tickFormatter={(v) => truncateName(v, 18)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent 
                    hideLabel={true}
                    formatter={(value, name, item) => {
                      const product = item.payload as TopProductData;
                      return [
                        <div key="tooltip" className="flex flex-col gap-1">
                          <span className="font-medium">{product.name}</span>
                          <span className="text-muted-foreground">{product.brand}</span>
                          <span>Receita: {formatCurrency(product.revenue)}</span>
                          <span>Vendas: {product.count} unidades</span>
                        </div>,
                        ""
                      ];
                    }}
                  />
                }
              />
              <Bar 
                dataKey="revenue" 
                radius={[0, 4, 4, 0]}
                onClick={(entry) => {
                  if (entry?.name) {
                    openProductModal(getExactProductKey(entry.name));
                  }
                }}
                className="cursor-pointer"
              >
                {data.map((product, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getBrandChartColor(product.brand)} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <div data-testid="top-products-empty" className="flex-1 min-h-[300px] flex items-center justify-center text-muted-foreground">
            Nenhum dado de produtos disponível
          </div>
        )}
        
        {/* Badge para o primeiro lugar */}
        {data.length > 0 && (
          <div className="flex items-center justify-center mt-2">
            <button
              onClick={() => openProductModal(getExactProductKey(data[0].name))}
              className="focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
            >
              <Badge data-testid="top-seller-badge" variant="secondary" className="gap-1 cursor-pointer hover:bg-secondary/80">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
                Mais vendido: {truncateName(data[0].name, 25)}
              </Badge>
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
