import { Flame, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import { TopProductData, exportToExcel } from "@/lib/dashboardUtils";
import { formatCurrency, pluralize } from "@/lib/utils";
import { getBrandChartColor } from "@/lib/brandAssets";
import { useProductModal } from "@/contexts/ProductModalContext";
import { getExactProductKey } from "@/lib/productNormalization";
import { ChartCard } from "./ChartCard";

interface TopProductsChartProps {
  data: TopProductData[];
  animationDelay?: number;
  selectedPdvId?: string;
}

const chartConfig = {
  revenue: { label: "Receita" },
};

export function TopProductsChart({ data, animationDelay = 0, selectedPdvId }: TopProductsChartProps) {
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
    <ChartCard
      testId="top-products-chart"
      title="Top 10 Produtos"
      description="Produtos com maior receita no período"
      icon={Trophy}
      iconColor="text-amber-500"
      onExport={handleExport}
      exportTestId="export-top-products"
      animationDelay={animationDelay}
    >
      {data.length > 0 ? (
        <>
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
                          <span>Vendas: {pluralize(product.count, 'unidade', 'unidades')}</span>
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
                    openProductModal(getExactProductKey(entry.name), selectedPdvId);
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
          
          <div className="flex items-center justify-center mt-2">
            <button
              onClick={() => openProductModal(getExactProductKey(data[0].name), selectedPdvId)}
              className="focus:outline-none focus:ring-2 focus:ring-primary/20 rounded"
              aria-label={`Ver detalhes do produto mais vendido: ${data[0].name}`}
            >
              <Badge data-testid="top-seller-badge" variant="secondary" className="gap-1 cursor-pointer hover:bg-secondary/80">
                <Flame className="h-3.5 w-3.5 text-orange-500" aria-hidden="true" />
                Mais vendido: {truncateName(data[0].name, 25)}
              </Badge>
            </button>
          </div>
        </>
      ) : (
        <div data-testid="top-products-empty" className="flex-1 min-h-[300px] flex items-center justify-center text-muted-foreground">
          Nenhum dado de produtos disponível
        </div>
      )}
    </ChartCard>
  );
}
