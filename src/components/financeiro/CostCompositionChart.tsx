import { useState } from "react";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { MonthlyDREData } from "@/hooks/useAnnualDRE";
import { ChartCard, type ChartType } from "@/components/dashboard/ChartCard";
import { PieChart } from "lucide-react";

const chartConfig = {
  cmv: { label: "CMV", color: "hsl(var(--chart-1))" },
  taxasStone: { label: "Taxas Stone", color: "hsl(var(--chart-2))" },
  impostos: { label: "Impostos", color: "hsl(var(--chart-3))" },
  despesasFixas: { label: "Despesas Fixas", color: "hsl(var(--chart-4))" },
  reembolsos: { label: "Deduções", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig;

const dataKeys = ["cmv", "taxasStone", "impostos", "despesasFixas", "reembolsos"] as const;
const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

interface CostCompositionChartProps {
  data: MonthlyDREData[];
}

export function CostCompositionChart({ data }: CostCompositionChartProps) {
  const [chartType, setChartType] = useState<ChartType>("bar");
  const hasData = data.some((d) => d.cmv > 0 || d.taxasStone > 0 || d.impostos > 0 || d.despesasFixas > 0 || d.reembolsos > 0);
  if (!hasData) return null;

  const sharedElements = (
    <>
      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
      <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
      <YAxis tickFormatter={(v: number) => `R$ ${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={60} />
      <Legend verticalAlign="top" height={36} formatter={(value: string) => chartConfig[value as keyof typeof chartConfig]?.label ?? value} />
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
    </>
  );

  return (
    <ChartCard
      title="Composição de Custos"
      description="Distribuição mensal dos custos e deduções"
      icon={PieChart}
      iconColor="text-chart-3"
      chartTypeOptions={["bar", "area", "line"]}
      activeChartType={chartType}
      onChartTypeChange={setChartType}
    >
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        {chartType === "bar" ? (
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            {sharedElements}
            <Bar dataKey="cmv" stackId="costs" fill={colors[0]} radius={[0, 0, 0, 0]} />
            <Bar dataKey="taxasStone" stackId="costs" fill={colors[1]} />
            <Bar dataKey="impostos" stackId="costs" fill={colors[2]} />
            <Bar dataKey="despesasFixas" stackId="costs" fill={colors[3]} />
            <Bar dataKey="reembolsos" stackId="costs" fill={colors[4]} radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : chartType === "area" ? (
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            {sharedElements}
            {dataKeys.map((key, i) => (
              <Area key={key} type="monotone" dataKey={key} stackId="costs" stroke={colors[i]} fill={colors[i]} fillOpacity={0.15} strokeWidth={2} />
            ))}
          </AreaChart>
        ) : (
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            {sharedElements}
            {dataKeys.map((key, i) => (
              <Line key={key} type="monotone" dataKey={key} stroke={colors[i]} strokeWidth={2} dot={{ r: 3 }} />
            ))}
          </LineChart>
        )}
      </ChartContainer>
    </ChartCard>
  );
}
