import { useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, Cell, Legend } from "recharts";
import { SalesByDayData, aggregateByMonth } from "@/lib/dashboardUtils";
import { formatCurrency, pluralize } from "@/lib/utils";
import { ChartCard } from "./ChartCard";
import { Button } from "@/components/ui/button";

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

type ViewMode = "daily" | "monthly";

export function SalesByDayChart({ data, animationDelay = 0 }: SalesByDayChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("daily");

  const displayData = useMemo(() => {
    return viewMode === "monthly" ? aggregateByMonth(data) : data;
  }, [data, viewMode]);

  const { average, maxIdx, minIdx } = useMemo(() => {
    if (displayData.length === 0) return { average: 0, maxIdx: -1, minIdx: -1 };
    
    const revenues = displayData.map(d => d.revenue);
    const max = Math.max(...revenues);
    const min = Math.min(...revenues);
    const avg = revenues.reduce((a, b) => a + b, 0) / revenues.length;
    
    return {
      average: avg,
      maxIdx: revenues.indexOf(max),
      minIdx: revenues.indexOf(min),
    };
  }, [displayData]);
  
  const handleExport = () => {
    exportToExcel(
      displayData.map(d => ({
        Data: d.dateDisplay,
        Receita: d.revenue,
        Quantidade: d.count,
      })),
      viewMode === "monthly" ? "vendas-por-mes" : "vendas-por-dia"
    );
  };
  
  const getBarColor = (index: number) => {
    if (index === maxIdx) return "hsl(var(--chart-2))";
    if (index === minIdx) return "hsl(var(--chart-3))";
    return "hsl(var(--chart-1))";
  };

  if (data.length === 0) {
    return null;
  }

  const title = viewMode === "monthly" ? "Vendas por Mês" : "Vendas por Dia";
  const description = viewMode === "monthly"
    ? "Receita agregada por mês"
    : "Evolução da receita ao longo do período";

  const viewToggle = (
    <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
      <Button
        variant={viewMode === "daily" ? "secondary" : "ghost"}
        size="sm"
        className="h-6 px-2 text-xs"
        onClick={() => setViewMode("daily")}
      >
        Diário
      </Button>
      <Button
        variant={viewMode === "monthly" ? "secondary" : "ghost"}
        size="sm"
        className="h-6 px-2 text-xs"
        onClick={() => setViewMode("monthly")}
      >
        Mensal
      </Button>
    </div>
  );

  return (
    <ChartCard
      testId="sales-by-day-chart"
      title={title}
      description={description}
      icon={TrendingUp}
      iconColor="text-chart-2"
      animationDelay={animationDelay}
      headerBadge={viewToggle}
    >
      <ChartContainer 
        config={chartConfig} 
        className="h-[300px] w-full"
        role="img"
        aria-label={`Gráfico de ${title.toLowerCase()} mostrando ${displayData.length} ${viewMode === "monthly" ? "meses" : "dias"}. Média: ${formatCurrency(average)}`}
      >
        <BarChart data={displayData} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
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
                      <span className="font-medium">{entry.dateDisplay}</span>
                      <span>Receita: {formatCurrency(entry.revenue)}</span>
                      <span className="text-muted-foreground text-sm">
                        {pluralize(entry.count, 'venda', 'vendas')}
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
            {displayData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(index)} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}
