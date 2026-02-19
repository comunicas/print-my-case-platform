import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, Legend } from "recharts";
import { TrendingDown } from "lucide-react";
import { useMemo } from "react";
import { formatCurrency, pluralize } from "@/lib/utils";
import { exportToExcel, LossesByDayData } from "@/lib/dashboardUtils";
import { ChartCard } from "./ChartCard";

interface LossesByDayChartProps {
  data: LossesByDayData[];
  animationDelay?: number;
}

const chartConfig = {
  cancellations: {
    label: "Cancelamentos",
    color: "hsl(var(--warning))",
  },
  refunds: {
    label: "Reembolsos",
    color: "hsl(var(--destructive))",
  },
} satisfies ChartConfig;

export function LossesByDayChart({ data, animationDelay = 0 }: LossesByDayChartProps) {
  const { averageLoss, totalLosses } = useMemo(() => {
    const total = data.reduce((sum, d) => sum + d.total, 0);
    const daysWithLosses = data.filter(d => d.total > 0).length;
    return {
      averageLoss: daysWithLosses > 0 ? total / daysWithLosses : 0,
      totalLosses: total,
    };
  }, [data]);

  const handleExport = () => {
    const exportData = data.map(d => ({
      Data: d.dateDisplay,
      Cancelamentos: d.cancellations,
      "Qtd. Cancelamentos": d.cancellationCount,
      Reembolsos: d.refunds,
      "Qtd. Reembolsos": d.refundCount,
      "Total Perdas": d.total,
    }));
    exportToExcel(exportData, "perdas-por-dia");
  };

  if (data.length === 0 || totalLosses === 0) {
    return null;
  }

  return (
    <ChartCard
      testId="losses-by-day-chart"
      title="Perdas por Dia"
      description="Cancelamentos e reembolsos ao longo do período"
      icon={TrendingDown}
      iconColor="text-destructive"
      onExport={handleExport}
      animationDelay={animationDelay}
    >
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <BarChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
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
                formatter={(value, name) => {
                  const label = name === "cancellations" ? "Cancelamentos" : "Reembolsos";
                  return (
                    <span className="font-medium">
                      {label}: {formatCurrency(Number(value))}
                    </span>
                  );
                }}
                labelFormatter={(label, payload) => {
                  if (payload && payload.length > 0) {
                    const item = payload[0].payload as LossesByDayData;
                    return (
                      <div className="space-y-1">
                        <div className="font-semibold">{label}</div>
                        <div className="text-xs text-muted-foreground">
                          {pluralize(item.cancellationCount, 'cancelamento', 'cancelamentos')} • {pluralize(item.refundCount, 'reembolso', 'reembolsos')}
                        </div>
                      </div>
                    );
                  }
                  return label;
                }}
              />
            }
          />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value) => (
              <span className="text-xs">
                {value === "cancellations" ? "Cancelamentos" : "Reembolsos"}
              </span>
            )}
          />
          {averageLoss > 0 && (
            <ReferenceLine
              y={averageLoss}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Média: ${formatCurrency(averageLoss)}`,
                position: "insideTopRight",
                className: "text-[10px] fill-muted-foreground",
              }}
            />
          )}
          <Bar
            dataKey="cancellations"
            stackId="losses"
            fill="hsl(var(--warning))"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="refunds"
            stackId="losses"
            fill="hsl(var(--destructive))"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}
