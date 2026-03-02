import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { MonthlyDREData } from "@/hooks/useAnnualDRE";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { PieChart } from "lucide-react";

const chartConfig = {
  cmv: { label: "CMV", color: "hsl(var(--chart-1))" },
  taxasStone: { label: "Taxas Stone", color: "hsl(var(--chart-2))" },
  impostos: { label: "Impostos", color: "hsl(var(--chart-3))" },
  despesasFixas: { label: "Despesas Fixas", color: "hsl(var(--chart-4))" },
  reembolsos: { label: "Deduções", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig;

interface CostCompositionChartProps {
  data: MonthlyDREData[];
}

export function CostCompositionChart({ data }: CostCompositionChartProps) {
  const hasData = data.some((d) => d.cmv > 0 || d.taxasStone > 0 || d.impostos > 0 || d.despesasFixas > 0 || d.reembolsos > 0);
  if (!hasData) return null;

  return (
    <ChartCard
      title="Composição de Custos"
      description="Distribuição mensal dos custos e deduções"
      icon={PieChart}
      iconColor="text-chart-3"
    >
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis
            tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={60}
          />
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
          <Bar dataKey="cmv" stackId="costs" fill="hsl(var(--chart-1))" radius={[0, 0, 0, 0]} />
          <Bar dataKey="taxasStone" stackId="costs" fill="hsl(var(--chart-2))" />
          <Bar dataKey="impostos" stackId="costs" fill="hsl(var(--chart-3))" />
          <Bar dataKey="despesasFixas" stackId="costs" fill="hsl(var(--chart-4))" />
          <Bar dataKey="reembolsos" stackId="costs" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}
