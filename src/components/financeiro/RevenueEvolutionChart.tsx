import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { MonthlyDREData } from "@/hooks/useAnnualDRE";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { TrendingUp } from "lucide-react";

const chartConfig = {
  receitaBruta: { label: "Receita Bruta", color: "hsl(var(--chart-1))" },
  receitaLiquida: { label: "Receita Líquida", color: "hsl(var(--chart-2))" },
  lucroBruto: { label: "Lucro Bruto", color: "hsl(var(--chart-3))" },
  resultadoOperacional: { label: "Resultado Operacional", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

interface RevenueEvolutionChartProps {
  data: MonthlyDREData[];
}

export function RevenueEvolutionChart({ data }: RevenueEvolutionChartProps) {
  const hasData = data.some((d) => d.receitaBruta > 0);
  if (!hasData) return null;

  return (
    <ChartCard
      title="Evolução Mensal"
      description="Receita, lucro bruto e resultado ao longo do ano"
      icon={TrendingUp}
      iconColor="text-chart-1"
    >
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis
            tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={60}
          />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value: string) => chartConfig[value as keyof typeof chartConfig]?.label ?? value}
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
          <Area type="monotone" dataKey="receitaBruta" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.1} strokeWidth={2} />
          <Area type="monotone" dataKey="receitaLiquida" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.1} strokeWidth={2} />
          <Area type="monotone" dataKey="lucroBruto" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" fillOpacity={0.1} strokeWidth={2} />
          <Area type="monotone" dataKey="resultadoOperacional" stroke="hsl(var(--chart-4))" fill="hsl(var(--chart-4))" fillOpacity={0.1} strokeWidth={2} />
        </AreaChart>
      </ChartContainer>
    </ChartCard>
  );
}
