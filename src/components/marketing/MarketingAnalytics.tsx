import { useState } from "react";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { Users, MousePointerClick, Percent, TrendingUp, BarChart3 } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { useMarketingAnalytics } from "@/hooks/useMarketingAnalytics";
import { DateRangeFilter, DateRange } from "@/components/dashboard/DateRangeFilter";
import { KPICard } from "@/components/dashboard/KPICard";
import { ChartCard } from "@/components/dashboard/ChartCard";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { ChartEmptyState } from "@/components/dashboard/ChartEmptyState";
import { Skeleton } from "@/components/ui/skeleton";

interface MarketingAnalyticsProps {
  selectedPdvId?: string;
}

const leadsChartConfig = {
  count: { label: "Leads", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

const clicksChartConfig = {
  count: { label: "Cliques", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

export function MarketingAnalytics({ selectedPdvId }: MarketingAnalyticsProps) {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfDay(subDays(new Date(), 29)),
    to: endOfDay(new Date()),
  });

  const {
    totalLeads,
    totalClicks,
    conversionRate,
    avgLeadsPerDay,
    leadsByDay,
    clicksByDay,
    isLoading,
  } = useMarketingAnalytics({
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
    pdvId: selectedPdvId,
  });

  return (
    <div className="space-y-6">
      <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))
        ) : (
          <>
            <KPICard title="Total de Leads" value={String(totalLeads)} icon={Users} />
            <KPICard title="Total de Cliques" value={String(totalClicks)} icon={MousePointerClick} />
            <KPICard title="Taxa de Conversão" value={`${conversionRate.toFixed(1)}%`} icon={Percent} />
            <KPICard title="Média Diária" value={avgLeadsPerDay.toFixed(1)} icon={TrendingUp} />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <ChartCard
          title="Leads por Dia"
          description="Leads capturados ao longo do período"
          icon={Users}
          iconColor="text-chart-1"
        >
          {isLoading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : leadsByDay.every((d) => d.count === 0) ? (
            <ChartEmptyState title="Nenhum lead no período" />
          ) : (
            <ChartContainer config={leadsChartConfig} className="h-[250px] w-full">
              <AreaChart data={leadsByDay} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="dateDisplay" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={30} allowDecimals={false} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => [`${value} leads`, ""]}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--chart-1))"
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Cliques por Dia"
          description="Cliques nos links curtos do catálogo"
          icon={BarChart3}
          iconColor="text-chart-2"
        >
          {isLoading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : clicksByDay.every((d) => d.count === 0) ? (
            <ChartEmptyState title="Nenhum clique no período" />
          ) : (
            <ChartContainer config={clicksChartConfig} className="h-[250px] w-full">
              <BarChart data={clicksByDay} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="dateDisplay" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={30} allowDecimals={false} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => [`${value} cliques`, ""]}
                    />
                  }
                />
                <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
