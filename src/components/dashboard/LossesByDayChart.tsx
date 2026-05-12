import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, Legend } from "recharts";
import { TrendingDown } from "lucide-react";
import { useMemo, useState } from "react";
import { formatCurrency, pluralize } from "@/lib/utils";
import { LossesByDayData, aggregateLossesByMonth } from "@/lib/dashboardUtils";
import { ChartCard } from "./ChartCard";
import { Button } from "@/components/ui/button";

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

type ViewMode = "daily" | "monthly";

export function LossesByDayChart({ data, animationDelay = 0 }: LossesByDayChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("daily");

  const displayData = useMemo(() => {
    return viewMode === "monthly" ? aggregateLossesByMonth(data) : data;
  }, [data, viewMode]);

  const { averageLoss, totalLosses } = useMemo(() => {
    const total = displayData.reduce((sum, d) => sum + d.total, 0);
    const withLosses = displayData.filter(d => d.total > 0).length;
    return {
      averageLoss: withLosses > 0 ? total / withLosses : 0,
      totalLosses: total,
    };
  }, [displayData]);

  if (data.length === 0 || totalLosses === 0) {
    return null;
  }

  const title = viewMode === "monthly" ? "Perdas por Mês" : "Perdas por Dia";
  const description = viewMode === "monthly"
    ? "Cancelamentos e reembolsos agregados por mês"
    : "Cancelamentos e reembolsos ao longo do período";

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
      testId="losses-by-day-chart"
      title={title}
      description={description}
      icon={TrendingDown}
      iconColor="text-destructive"
      animationDelay={animationDelay}
      headerBadge={viewToggle}
    >
      <ChartContainer config={chartConfig} className="h-[300px] w-full">
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
