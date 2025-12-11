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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { Loader2, BarChart3 } from "lucide-react";
import { useReportFilters } from "@/contexts/ReportFiltersContext";
import { useReportSalesUnit } from "@/hooks/useReportSalesUnit";
import { ReportFilters } from "./ReportFilters";
import { ReportEmptyState } from "./ReportEmptyState";
import { getVariationIcon, getVariationColor, formatCurrency } from "@/lib/utils/report-helpers";

const chartConfig = {
  revenue: { label: "Receita", color: "hsl(var(--primary))" },
};

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function SalesUnitReport() {
  const { startDate, endDate, selectedPdv, formatPeriod } = useReportFilters();
  const { data, isLoading } = useReportSalesUnit({ startDate, endDate, selectedPdv });

  // Build dynamic chart config for evolution
  const evolutionChartConfig: Record<string, { label: string; color: string }> = {};
  
  if (data?.evolutionData && data.evolutionData.length > 0) {
    const firstEntry = data.evolutionData[0];
    Object.keys(firstEntry).filter(k => k !== "month").forEach((key, index) => {
      evolutionChartConfig[key] = {
        label: key,
        color: chartColors[index % chartColors.length],
      };
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasData = data && data.salesByPdv.length > 0;

  return (
    <div className="space-y-6">
      <ReportFilters showPdvFilter showDateFilter />

      {!hasData ? (
        <ReportEmptyState
          icon={BarChart3}
          title="Sem dados de vendas"
          description="Faça upload de planilhas de vendas para visualizar o relatório por unidade."
        />
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Receita Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.totals.revenue)}</div>
                <p className="text-xs text-muted-foreground mt-1">{formatPeriod()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Transações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.totals.transactions.toLocaleString("pt-BR")}
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
                  PDVs Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totals.activePdvs}</div>
                <p className="text-xs text-muted-foreground mt-1">{formatPeriod()}</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
            {/* Bar Chart - Revenue by PDV */}
            <Card>
              <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
                <CardTitle className="text-base md:text-lg">Receita por PDV</CardTitle>
              </CardHeader>
              <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <BarChart data={data.salesByPdv} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} className="stroke-muted" />
                    <XAxis 
                      type="number" 
                      className="text-xs" 
                      tick={{ fill: "hsl(var(--muted-foreground))" }} 
                      tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} 
                    />
                    <YAxis 
                      type="category" 
                      dataKey="pdv" 
                      width={100} 
                      className="text-xs" 
                      tick={{ fill: "hsl(var(--muted-foreground))" }} 
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => formatCurrency(Number(value))}
                        />
                      }
                    />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Line Chart - Evolution */}
            <Card>
              <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
                <CardTitle className="text-base md:text-lg">Evolução por Período</CardTitle>
              </CardHeader>
              <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
                {data.evolutionData.length > 0 ? (
                  <ChartContainer config={evolutionChartConfig} className="h-[300px] w-full">
                    <LineChart data={data.evolutionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="month" 
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
                      {Object.keys(evolutionChartConfig).map((key, index) => (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          stroke={chartColors[index % chartColors.length]}
                          strokeWidth={2}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Dados insuficientes para evolução
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
              <CardTitle className="text-base md:text-lg">Detalhamento por Unidade</CardTitle>
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PDV</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                    <TableHead className="text-right">Transações</TableHead>
                    <TableHead className="text-right">Ticket Médio</TableHead>
                    <TableHead className="text-right">Variação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.salesByPdv.map((row) => {
                    const VariationIcon = getVariationIcon(row.variation);
                    return (
                      <TableRow key={row.pdvId}>
                        <TableCell className="font-medium">{row.pdv}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.revenue)}</TableCell>
                        <TableCell className="text-right">{row.transactions}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.avgTicket)}</TableCell>
                        <TableCell className="text-right">
                          <div className={`flex items-center justify-end gap-1 ${getVariationColor(row.variation)}`}>
                            <VariationIcon className="h-4 w-4" />
                            <span>{row.variation > 0 ? "+" : ""}{row.variation}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
