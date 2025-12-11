import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Download, TrendingUp, TrendingDown, Trophy, AlertTriangle, CalendarIcon, Loader2, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { datePresets } from "@/lib/utils/date-presets";
import { useReportProducts } from "@/hooks/useReportProducts";
import { usePDVs } from "@/hooks/usePDVs";
import { ReportEmptyState } from "./ReportEmptyState";

const chartConfig = {
  quantity: { label: "Quantidade", color: "hsl(var(--primary))" },
};

export function ProductsReport() {
  const [selectedPdv, setSelectedPdv] = useState("all");
  const [viewMode, setViewMode] = useState<"top" | "bottom">("top");
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const { pdvs } = usePDVs();
  const { data, isLoading } = useReportProducts({ startDate, endDate, selectedPdv, viewMode });

  const pdvList = [
    { id: "all", name: "Todos os PDVs" },
    ...(pdvs?.map(p => ({ id: p.id, name: p.name })) || []),
  ];

  const handlePresetClick = (preset: typeof datePresets[0]) => {
    const { start, end } = preset.getDates();
    setStartDate(start);
    setEndDate(end);
  };

  const formatPeriod = () => {
    if (startDate && endDate) {
      return `${format(startDate, "dd/MM", { locale: ptBR })} - ${format(endDate, "dd/MM/yyyy", { locale: ptBR })}`;
    }
    return "";
  };

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

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4">
        {/* Date Presets */}
        <div className="flex flex-wrap gap-2">
          {datePresets.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              onClick={() => handlePresetClick(preset)}
              className="text-xs"
            >
              {preset.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
          <Select value={selectedPdv} onValueChange={setSelectedPdv}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Selecione o PDV" />
            </SelectTrigger>
            <SelectContent>
              {pdvList.map((pdv) => (
                <SelectItem key={pdv.id} value={pdv.id}>
                  {pdv.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-[180px] justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Data inicial"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => {
                  setStartDate(date);
                  if (date && endDate && date > endDate) {
                    setEndDate(date);
                  }
                }}
                initialFocus
                className="pointer-events-auto"
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-[180px] justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Data final"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                disabled={(date) => (startDate ? date < startDate : false)}
                initialFocus
                className="pointer-events-auto"
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>

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

          <Button variant="outline" className="gap-2 sm:ml-auto">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

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
                <div className="text-2xl font-bold">
                  {data.totals.totalRevenue.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </div>
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
                <div className="text-2xl font-bold">
                  {data.totals.avgTicket.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </div>
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
                          <TableCell className="text-right">
                            {row.revenue.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.avgPrice.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </TableCell>
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
                          <TableCell className="text-right">
                            {row.revenue.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.avgPrice.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </TableCell>
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
