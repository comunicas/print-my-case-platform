import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, Legend } from "recharts";
import type { MonthlyDREData } from "@/hooks/useAnnualDRE";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { Percent } from "lucide-react";

const chartConfig = {
  margemBruta: { label: "Margem Bruta", color: "hsl(var(--chart-2))" },
  margemOperacional: { label: "Margem Operacional", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

interface MarginsChartProps {
  data: MonthlyDREData[];
}

export function MarginsChart({ data }: MarginsChartProps) {
  const chartData = data.map((d) => ({
    monthLabel: d.monthLabel,
    margemBruta: d.receitaLiquida > 0 ? (d.lucroBruto / d.receitaLiquida) * 100 : null,
    margemOperacional: d.receitaLiquida > 0 ? (d.resultadoOperacional / d.receitaLiquida) * 100 : null,
  }));

  const hasData = chartData.some((d) => d.margemBruta !== null);
  if (!hasData) return null;

  return (
    <ChartCard
      title="Margens Mensais"
      description="Evolução das margens bruta e operacional (%)"
      icon={Percent}
      iconColor="text-chart-2"
    >
      <ChartContainer config={chartConfig} className="h-[280px] w-full">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis
            tickFormatter={(v) => `${v.toFixed(0)}%`}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={45}
          />
          <ReferenceLine
            y={0}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="4 4"
            strokeWidth={1}
            label={{ value: "Breakeven", position: "insideTopRight", fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
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
                  if (value === null || value === undefined) return ["—", ""];
                  const cfg = chartConfig[name as keyof typeof chartConfig];
                  return [`${Number(value).toFixed(1)}%`, cfg?.label ?? name];
                }}
              />
            }
          />
          <Line type="monotone" dataKey="margemBruta" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 3 }} connectNulls />
          <Line type="monotone" dataKey="margemOperacional" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={{ r: 3 }} connectNulls />
        </LineChart>
      </ChartContainer>
    </ChartCard>
  );
}
