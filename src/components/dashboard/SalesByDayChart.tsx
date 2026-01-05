import { useMemo } from "react";
import { Download, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, Cell, Legend } from "recharts";
import { SalesByDayData, exportToExcel } from "@/lib/dashboardUtils";
import { formatCurrency } from "@/lib/utils";

interface SalesByDayChartProps {
  data: SalesByDayData[];
}

const chartConfig = {
  revenue: { 
    label: "Receita", 
    color: "hsl(var(--chart-1))" 
  },
} satisfies ChartConfig;

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

  if (processedData.length === 0) {
    return null;
  }

  return (
    <Card data-testid="sales-by-day-chart">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-5 w-5 text-chart-2" />
            Vendas por Dia
          </CardTitle>
          <CardDescription>
            Evolução da receita ao longo do período
          </CardDescription>
        </div>
        <Button 
          data-testid="export-sales-by-day" 
          variant="outline" 
          size="sm" 
          onClick={handleExport}
        >
          <Download className="h-4 w-4 mr-1" />
          Excel
        </Button>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={processedData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="dateDisplay"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={55}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel={true}
                  formatter={(value, name, item) => {
                    const entry = item.payload as SalesByDayData;
                    return [
                      <div key="tooltip" className="flex flex-col gap-1">
                        <span className="font-medium">Dia {entry.dateDisplay}</span>
                        <span>Receita: {formatCurrency(entry.revenue)}</span>
                        <span className="text-muted-foreground text-sm">
                          {entry.count} vendas
                        </span>
                      </div>,
                      ""
                    ];
                  }}
                />
              }
            />
            <Legend 
              verticalAlign="top" 
              height={36}
              formatter={() => "Receita"}
            />
            <ReferenceLine
              y={average}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Média: ${formatCurrency(average)}`,
                position: "insideTopRight",
                className: "text-[10px] fill-muted-foreground",
              }}
            />
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]} name="Receita">
              {processedData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(index)} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
