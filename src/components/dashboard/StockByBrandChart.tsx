import { Download, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";
import { StockByBrandData, exportToExcel } from "@/lib/dashboardUtils";
import { BrandLogo } from "@/components/ui/BrandLogo";

interface StockByBrandChartProps {
  data: StockByBrandData[];
}

export function StockByBrandChart({ data }: StockByBrandChartProps) {
  const total = data.reduce((acc, d) => acc + d.quantity, 0);
  
  const chartConfig = data.reduce((acc, item) => {
    acc[item.brand] = { label: item.brand, color: item.fill };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);
  
  const handleExport = () => {
    exportToExcel(
      data.map(d => ({
        Marca: d.brand,
        Quantidade: d.quantity,
        Percentual: `${Math.round((d.quantity / total) * 100)}%`,
      })),
      "estoque-por-marca"
    );
  };

  return (
    <Card data-testid="stock-by-brand-chart" className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between px-4 md:px-6 pt-4 md:pt-6 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Package className="h-5 w-5 text-blue-500" />
            Estoque por Marca
          </CardTitle>
          <CardDescription>
            Distribuição do estoque atual por marca
          </CardDescription>
        </div>
        <Button data-testid="export-stock-by-brand" variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" />
          Excel
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col px-4 md:px-6 pb-4 md:pb-6">
        {data.length > 0 ? (
          <ChartContainer config={chartConfig} className="flex-1 min-h-[250px] w-full">
            <PieChart>
              <ChartTooltip 
                content={
                  <ChartTooltipContent 
                    hideLabel={true}
                    formatter={(value, name, item) => {
                      const entry = item.payload as StockByBrandData;
                      const pct = Math.round((entry.quantity / total) * 100);
                      return [
                        <div key="tooltip" className="flex flex-col gap-1">
                          <span className="font-medium">{entry.brand}</span>
                          <span>{entry.quantity} unidades</span>
                          <span className="text-muted-foreground text-sm">
                            {pct}% do estoque total
                          </span>
                        </div>,
                        ""
                      ];
                    }}
                  />
                }
              />
              <Pie
                data={data}
                dataKey="quantity"
                nameKey="brand"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend
                content={
                  <ChartLegendContent 
                    payload={data.map((entry) => ({
                      value: entry.brand,
                      type: "circle",
                      color: entry.fill,
                    }))}
                  />
                }
              />
              {/* Centro do donut */}
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground"
              >
                <tspan x="50%" dy="-0.5em" className="text-2xl font-bold">
                  {total}
                </tspan>
                <tspan x="50%" dy="1.5em" className="text-xs fill-muted-foreground">
                  unidades
                </tspan>
              </text>
            </PieChart>
          </ChartContainer>
        ) : (
          <div data-testid="stock-by-brand-empty" className="flex-1 min-h-[250px] flex items-center justify-center text-muted-foreground">
            Nenhum dado de estoque disponível
          </div>
        )}
      </CardContent>
    </Card>
  );
}
