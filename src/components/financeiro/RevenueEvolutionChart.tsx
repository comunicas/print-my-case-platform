import { useState } from "react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { MonthlyDREData } from "@/hooks/useAnnualDRE";
import { ChartCard, type ChartType } from "@/components/dashboard/ChartCard";
import { TrendingUp } from "lucide-react";

const chartConfig = {
  receitaBruta: { label: "Receita Bruta", color: "hsl(var(--chart-1))" },
  receitaLiquida: { label: "Receita Líquida", color: "hsl(var(--chart-2))" },
  lucroBruto: { label: "Lucro Bruto", color: "hsl(var(--chart-3))" },
  resultadoOperacional: { label: "Resultado Operacional", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

const dataKeys = ["receitaBruta", "receitaLiquida", "lucroBruto", "resultadoOperacional"] as const;
const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

interface RevenueEvolutionChartProps {
  data: MonthlyDREData[];
}

export function RevenueEvolutionChart({ data }: RevenueEvolutionChartProps) {
  const [chartType, setChartType] = useState<ChartType>("area");
  const hasData = data.some((d) => d.receitaBruta > 0);
  if (!hasData) return null;

  const sharedAxisProps = {
    xAxis: <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />,
    yAxis: <YAxis tickFormatter={(v: number) => `R$ ${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={60} />,
    grid: <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />,
    legend: <Legend verticalAlign="top" height={36} formatter={(value: string) => chartConfig[value as keyof typeof chartConfig]?.label ?? value} />,
    tooltip: (
      <ChartTooltip
        content={
          <ChartTooltipContent
            formatter={(value, name) => {
              const cfg = chartConfig[name as keyof typeof chartConfig];
              return [formatCurrency(Number(value)), cfg?.label ?? name];
            }}
          />
        }
      />
    ),
  };

  return (
    <ChartCard
      title="Evolução Mensal"
      description="Receita, lucro bruto e resultado ao longo do ano"
      icon={TrendingUp}
      iconColor="text-chart-1"
      chartTypeOptions={["area", "bar", "line"]}
      activeChartType={chartType}
      onChartTypeChange={setChartType}
    >
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        {chartType === "area" ? (
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            {sharedAxisProps.grid}
            {sharedAxisProps.xAxis}
            {sharedAxisProps.yAxis}
            {sharedAxisProps.legend}
            {sharedAxisProps.tooltip}
            {dataKeys.map((key, i) => (
              <Area key={key} type="monotone" dataKey={key} stroke={colors[i]} fill={colors[i]} fillOpacity={0.1} strokeWidth={2} />
            ))}
          </AreaChart>
        ) : chartType === "bar" ? (
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            {sharedAxisProps.grid}
            {sharedAxisProps.xAxis}
            {sharedAxisProps.yAxis}
            {sharedAxisProps.legend}
            {sharedAxisProps.tooltip}
            {dataKeys.map((key, i) => (
              <Bar key={key} dataKey={key} fill={colors[i]} radius={[2, 2, 0, 0]} />
            ))}
          </BarChart>
        ) : (
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            {sharedAxisProps.grid}
            {sharedAxisProps.xAxis}
            {sharedAxisProps.yAxis}
            {sharedAxisProps.legend}
            {sharedAxisProps.tooltip}
            {dataKeys.map((key, i) => (
              <Line key={key} type="monotone" dataKey={key} stroke={colors[i]} strokeWidth={2} dot={{ r: 3 }} />
            ))}
          </LineChart>
        )}
      </ChartContainer>
    </ChartCard>
  );
}
