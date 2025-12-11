import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";
import { TrendingUp, TrendingDown, Loader2, Calendar } from "lucide-react";
import { useReportFilters } from "@/contexts/ReportFiltersContext";
import { useReportMonthlySales } from "@/hooks/useReportMonthlySales";
import { ReportFilters } from "./ReportFilters";
import { ReportEmptyState } from "./ReportEmptyState";
import { formatCurrency } from "@/lib/utils/report-helpers";

const chartConfig = {
  revenue: { label: "Receita", color: "hsl(var(--primary))" },
  transactions: { label: "Transações", color: "hsl(var(--chart-2))" },
};

export function MonthlySalesReport() {
  const { startDate, endDate, selectedPdv, formatPeriod } = useReportFilters();
  const { data, isLoading } = useReportMonthlySales({ startDate, endDate, selectedPdv });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasData = data && data.dailySales.length > 0;

  return (
    <div className="space-y-6">
      <ReportFilters showPdvFilter showDateFilter />

      {!hasData ? (
        <ReportEmptyState
          icon={Calendar}
          title="Sem dados de vendas mensais"
          description="Faça upload de planilhas de vendas para visualizar o relatório mensal."
        />
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Receita do Período
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.totals.totalRevenue)}</div>
                <div className={`flex items-center gap-1 text-sm mt-1 ${data.totals.variation >= 0 ? "text-emerald-500" : "text-destructive"}`}>
                  {data.totals.variation >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span>{data.totals.variation >= 0 ? "+" : ""}{data.totals.variation.toFixed(1)}% vs período anterior</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{formatPeriod()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ticket Médio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.totals.avgTicket)}</div>
                <p className="text-xs text-muted-foreground mt-1">{formatPeriod()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Melhor Dia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-500">
                  Dia {data.totals.bestDay.day}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(data.totals.bestDay.revenue)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pior Dia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  Dia {data.totals.worstDay.day}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(data.totals.worstDay.revenue)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
            {/* Area Chart - Daily Sales */}
            <Card className="xl:col-span-2">
              <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
                <CardTitle className="text-base md:text-lg">Vendas Diárias</CardTitle>
              </CardHeader>
              <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <AreaChart data={data.dailySales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="day" 
                      className="text-xs" 
                      tick={{ fill: "hsl(var(--muted-foreground))" }} 
                    />
                    <YAxis 
                      className="text-xs" 
                      tick={{ fill: "hsl(var(--muted-foreground))" }} 
                      tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`} 
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => formatCurrency(Number(value))}
                        />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Bar Chart - Weekday Sales */}
            <Card>
              <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
                <CardTitle className="text-base md:text-lg">Vendas por Dia da Semana</CardTitle>
              </CardHeader>
              <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <BarChart data={data.weekdaySales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="day" 
                      className="text-xs" 
                      tick={{ fill: "hsl(var(--muted-foreground))" }} 
                    />
                    <YAxis 
                      className="text-xs" 
                      tick={{ fill: "hsl(var(--muted-foreground))" }} 
                      tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} 
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => formatCurrency(Number(value))}
                        />
                      }
                    />
                    <Bar dataKey="revenue" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Weekly Summary Table */}
            <Card>
              <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
                <CardTitle className="text-base md:text-lg">Resumo Semanal</CardTitle>
              </CardHeader>
              <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Semana</TableHead>
                      <TableHead className="text-right">Receita</TableHead>
                      <TableHead className="text-right">Trans.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.weeklySummary.map((row) => (
                      <TableRow key={row.week}>
                        <TableCell className="font-medium text-sm">{row.week}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.revenue)}</TableCell>
                        <TableCell className="text-right">{row.transactions}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
