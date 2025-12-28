import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between px-4 md:px-6 pt-4 md:pt-6">
        <CardTitle className="text-base md:text-lg">Estoque por Marca</CardTitle>
        <Button variant="ghost" size="sm" onClick={handleExport} className="gap-1.5">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Exportar</span>
        </Button>
      </CardHeader>
      <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
        {data.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <PieChart>
              <ChartTooltip 
                content={
                  <ChartTooltipContent 
                    formatter={(value, name) => {
                      const qty = Number(value);
                      const pct = Math.round((qty / total) * 100);
                      return [`${qty} unidades (${pct}%)`, name];
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
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            Nenhum dado de estoque disponível
          </div>
        )}
      </CardContent>
    </Card>
  );
}
