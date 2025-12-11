import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, Trophy, AlertTriangle, Loader2, ShoppingBag } from "lucide-react";
import { useReportFilters } from "@/contexts/ReportFiltersContext";
import { useReportProducts } from "@/hooks/useReportProducts";
import { ReportFilters } from "./ReportFilters";
import { ReportEmptyState } from "./ReportEmptyState";
import { formatCurrency } from "@/lib/utils/report-helpers";

const chartConfig = {
  quantity: { label: "Quantidade", color: "hsl(var(--primary))" },
};

export function ProductsReport() {
  const [viewMode, setViewMode] = useState<"top" | "bottom">("top");
  const { startDate, endDate, selectedPdv, formatPeriod } = useReportFilters();
  const { data, isLoading } = useReportProducts({ startDate, endDate, selectedPdv, viewMode });

  // Build category chart config dynamically
  const categoryChartConfig: Record<string, { label: string; color: string }> = {};
  data?.categoryData?.forEach(cat => {
    categoryChartConfig[cat.name] = { label: cat.name, color: cat.fill };
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasData = data && (data.topProducts.length > 0 || data.bottomProducts.length > 0);
  const displayProducts = viewMode === "top" ? data?.topProducts : data?.bottomProducts;

  const viewModeActions = (
    <div className="flex gap-2">
      <Button
        variant={viewMode === "top" ? "default" : "outline"}
        onClick={() => setViewMode("top")}
        className="gap-2"
      >
        <Trophy className="h-4 w-4" />
        Mais Vendidos
      </Button>
      <Button
        variant={viewMode === "bottom" ? "default" : "outline"}
        onClick={() => setViewMode("bottom")}
        className="gap-2"
      >
        <AlertTriangle className="h-4 w-4" />
        Menos Vendidos
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <ReportFilters showPdvFilter showDateFilter extraActions={viewModeActions} />

      {!hasData ? (
        <ReportEmptyState
          icon={ShoppingBag}
          title="Sem dados de produtos"
          description="Faça upload de planilhas de vendas para visualizar a análise de produtos."
        />
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Produtos Vendidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.totals.totalSold.toLocaleString("pt-BR")} un.
                </div>
                <p className="text-xs text-muted-foreground mt-1">{formatPeriod()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Receita de Produtos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.totals.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground mt-1">{formatPeriod()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ticket Médio por Produto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.totals.avgTicket)}</div>
                <p className="text-xs text-muted-foreground mt-1">{formatPeriod()}</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
            {/* Bar Chart - Top/Bottom Products */}
            <Card>
              <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
                <CardTitle className="text-base md:text-lg">
                  {viewMode === "top" ? `Top ${displayProducts?.length || 0} Produtos` : `Bottom ${displayProducts?.length || 0} Produtos`}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
                <ChartContainer config={chartConfig} className="h-[350px] w-full">
                  <BarChart
                    data={displayProducts}
                    layout="vertical"
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} className="stroke-muted" />
                    <XAxis 
                      type="number" 
                      className="text-xs" 
                      tick={{ fill: "hsl(var(--muted-foreground))" }} 
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      className="text-xs"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => `${value} unidades`}
                        />
                      }
                    />
                    <Bar
                      dataKey="quantity"
                      fill={viewMode === "top" ? "hsl(var(--primary))" : "hsl(var(--destructive))"}
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Pie Chart - Categories */}
            <Card>
              <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
                <CardTitle className="text-base md:text-lg">Vendas por Categoria</CardTitle>
              </CardHeader>
              <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
                {data.categoryData.length > 0 ? (
                  <ChartContainer config={categoryChartConfig} className="h-[350px] w-full">
                    <PieChart>
                      <ChartTooltip
                        content={<ChartTooltipContent formatter={(value) => `${value}%`} />}
                      />
                      <Pie
                        data={data.categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {data.categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartLegend content={<ChartLegendContent />} />
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                    Sem dados de categorias
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
              <CardTitle className="text-base md:text-lg">
                {viewMode === "top" ? "Produtos Mais Vendidos" : "Produtos com Baixa Performance"}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">#</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Qtd.</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                    <TableHead className="text-right">Preço Médio</TableHead>
                    <TableHead className="text-right">
                      {viewMode === "top" ? "Tendência" : "Dias s/ Venda"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {viewMode === "top"
                    ? data.topProducts.map((row, index) => (
                        <TableRow key={row.name}>
                          <TableCell>
                            {index < 3 ? (
                              <Badge
                                variant="default"
                                className={
                                  index === 0
                                    ? "bg-yellow-500"
                                    : index === 1
                                    ? "bg-gray-400"
                                    : "bg-amber-600"
                                }
                              >
                                {index + 1}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">{index + 1}</span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{row.name}</TableCell>
                          <TableCell className="text-right">{row.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.revenue)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.avgPrice)}</TableCell>
                          <TableCell className="text-right">
                            <div
                              className={`flex items-center justify-end gap-1 ${
                                row.trend >= 0 ? "text-emerald-500" : "text-destructive"
                              }`}
                            >
                              {row.trend >= 0 ? (
                                <TrendingUp className="h-4 w-4" />
                              ) : (
                                <TrendingDown className="h-4 w-4" />
                              )}
                              <span>
                                {row.trend >= 0 ? "+" : ""}
                                {row.trend}%
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    : data.bottomProducts.map((row, index) => (
                        <TableRow key={row.name}>
                          <TableCell>
                            <span className="text-muted-foreground">{index + 1}</span>
                          </TableCell>
                          <TableCell className="font-medium">{row.name}</TableCell>
                          <TableCell className="text-right">{row.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.revenue)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.avgPrice)}</TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={row.daysWithoutSale > 30 ? "destructive" : "secondary"}
                            >
                              {row.daysWithoutSale} dias
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
