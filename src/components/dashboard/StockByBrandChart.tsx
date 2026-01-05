import { Package } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";
import { StockByBrandData, exportToExcel } from "@/lib/dashboardUtils";
import { ChartCard } from "./ChartCard";

interface StockByBrandChartProps {
  data: StockByBrandData[];
  animationDelay?: number;
}

export function StockByBrandChart({ data, animationDelay = 0 }: StockByBrandChartProps) {
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
    <ChartCard
      testId="stock-by-brand-chart"
      title="Estoque por Marca"
      description="Distribuição do estoque atual por marca"
      icon={Package}
      iconColor="text-blue-500"
      onExport={handleExport}
      exportTestId="export-stock-by-brand"
      animationDelay={animationDelay}
    >
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
    </ChartCard>
  );
}
