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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { Download, TrendingUp, TrendingDown, Minus, CalendarIcon, Loader2, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { datePresets } from "@/lib/mock-data";
import { useReportSalesUnit } from "@/hooks/useReportSalesUnit";
import { usePDVs } from "@/hooks/usePDVs";
import { ReportEmptyState } from "./ReportEmptyState";

const chartConfig = {
  revenue: { label: "Receita", color: "hsl(var(--primary))" },
};

export function SalesUnitReport() {
  const [selectedPdv, setSelectedPdv] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const { pdvs } = usePDVs();
  const { data, isLoading } = useReportSalesUnit({ startDate, endDate, selectedPdv });

  const pdvList = [
    { id: "all", name: "Todos os PDVs" },
    ...(pdvs?.map(p => ({ id: p.id, name: p.name })) || []),
  ];

  const getVariationIcon = (variation: number) => {
    if (variation > 0) return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    if (variation < 0) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getVariationColor = (variation: number) => {
    if (variation > 0) return "text-emerald-500";
    if (variation < 0) return "text-destructive";
    return "text-muted-foreground";
  };

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

  // Build dynamic chart config for evolution
  const evolutionChartConfig: Record<string, { label: string; color: string }> = {};
  const chartColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];
  
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

          <Button variant="outline" className="gap-2 sm:ml-auto">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

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
                <div className="text-2xl font-bold">
                  {data.totals.revenue.toLocaleString("pt-BR", {
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
                <div className="text-2xl font-bold">
                  {data.totals.avgTicket.toLocaleString("pt-BR", {
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
                          formatter={(value) =>
                            Number(value).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })
                          }
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
                            formatter={(value) =>
                              Number(value).toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })
                            }
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
                  {data.salesByPdv.map((row) => (
                    <TableRow key={row.pdvId}>
                      <TableCell className="font-medium">{row.pdv}</TableCell>
                      <TableCell className="text-right">
                        {row.revenue.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </TableCell>
                      <TableCell className="text-right">{row.transactions}</TableCell>
                      <TableCell className="text-right">
                        {row.avgTicket.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={`flex items-center justify-end gap-1 ${getVariationColor(row.variation)}`}>
                          {getVariationIcon(row.variation)}
                          <span>{row.variation > 0 ? "+" : ""}{row.variation}%</span>
                        </div>
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
