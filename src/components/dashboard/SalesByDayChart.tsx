import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, Cell, Legend } from "recharts";
import { SalesByDayData, exportToExcel } from "@/lib/dashboardUtils";
import { formatCurrency } from "@/lib/utils";
import { ChartCard } from "./ChartCard";

interface SalesByDayChartProps {
  data: SalesByDayData[];
  animationDelay?: number;
}

const chartConfig = {
  revenue: { 
    label: "Receita", 
    color: "hsl(var(--chart-1))" 
  },
} satisfies ChartConfig;

export function SalesByDayChart({ data, animationDelay = 0 }: SalesByDayChartProps) {
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
    if (index === maxIdx) return "hsl(var(--chart-2))";
    if (index === minIdx) return "hsl(var(--chart-3))";
    return "hsl(var(--chart-1))";
  };

  if (processedData.length === 0) {
    return null;
  }

  return (
    <ChartCard
      testId="sales-by-day-chart"
      title="Vendas por Dia"
      description="Evolução da receita ao longo do período"
      icon={TrendingUp}
      iconColor="text-chart-2"
      onExport={handleExport}
      exportTestId="export-sales-by-day"
      animationDelay={animationDelay}
    >
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
    </ChartCard>
  );
}
