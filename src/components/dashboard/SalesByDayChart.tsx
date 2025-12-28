import { useMemo } from "react";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, Cell } from "recharts";
import { SalesByDayData, exportToExcel } from "@/lib/dashboardUtils";
import { formatCurrency } from "@/lib/utils";

interface SalesByDayChartProps {
  data: SalesByDayData[];
}

const chartConfig = {
  revenue: { label: "Receita", color: "hsl(var(--chart-1))" },
};

export function SalesByDayChart({ data }: SalesByDayChartProps) {
  const { processedData, average, maxIdx, minIdx } = useMemo(() => {
    if (data.length === 0) return { processedData: [], average: 0, maxIdx: -1, minIdx: -1 };
    
    const revenues = data.map(d => d.revenue);
    const max = Math.max(...revenues);
    const min = Math.min(...revenues);
    const avg = revenues.reduce((a, b) => a + b, 0) / revenues.length;
    
    return {
      processedData: data,
      average: avg,
      maxIdx: revenues.indexOf(max),
      minIdx: revenues.indexOf(min),
    };
  }, [data]);
  
  const handleExport = () => {
    exportToExcel(
      data.map(d => ({
        Data: d.dateDisplay,
        Receita: d.revenue,
        Quantidade: d.count,
      })),
      "vendas-por-dia"
    );
  };
  
  const getBarColor = (index: number) => {
    if (index === maxIdx) return "hsl(var(--chart-2))"; // Verde para maior
    if (index === minIdx) return "hsl(var(--chart-3))"; // Laranja para menor
    return "hsl(var(--chart-1))"; // Azul para demais
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between px-4 md:px-6 pt-4 md:pt-6 pb-3">
        <CardTitle className="text-base md:text-lg">Vendas por Dia</CardTitle>
        <Button variant="ghost" size="sm" onClick={handleExport} className="gap-1.5">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Exportar</span>
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col px-4 md:px-6 pb-4 md:pb-6">
        {processedData.length > 0 ? (
          <ChartContainer config={chartConfig} className="flex-1 min-h-[250px] w-full">
            <BarChart data={processedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="dateDisplay" 
                className="text-xs" 
                tick={{ fill: "hsl(var(--muted-foreground))" }} 
              />
              <YAxis
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent 
                    formatter={(value, name) => [formatCurrency(Number(value)), "Receita"]}
                    labelFormatter={(label) => `Dia ${label}`}
                  />
                }
              />
              <ReferenceLine 
                y={average} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="5 5"
                label={{ 
                  value: `Média: ${formatCurrency(average)}`,
                  position: "insideTopRight",
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 10,
                }}
              />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                {processedData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex-1 min-h-[250px] flex items-center justify-center text-muted-foreground">
            Nenhum dado de vendas disponível
          </div>
        )}
      </CardContent>
    </Card>
  );
}
