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
import { Download, TrendingUp, TrendingDown, Minus, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { datePresets, pdvList as mockPdvList } from "@/lib/mock-data";

// Mock data
const pdvList = [
  { id: "all", name: "Todos os PDVs" },
  ...mockPdvList.map(p => ({ id: p.id, name: p.name }))
];

const salesByPdv = [
  { pdv: "Eldorado", revenue: 15780, transactions: 428, avgTicket: 36.87, variation: 12 },
  { pdv: "Ibirapuera", revenue: 12450, transactions: 342, avgTicket: 36.40, variation: 8 },
  { pdv: "Morumbi", revenue: 9230, transactions: 256, avgTicket: 36.05, variation: -2 },
  { pdv: "Pátio Paulista", revenue: 7650, transactions: 198, avgTicket: 38.64, variation: 5 },
];

const evolutionData = [
  { month: "Jul", Eldorado: 12500, Ibirapuera: 10200, Morumbi: 8100, "Pátio Paulista": 6800 },
  { month: "Ago", Eldorado: 13200, Ibirapuera: 10800, Morumbi: 8500, "Pátio Paulista": 7100 },
  { month: "Set", Eldorado: 14100, Ibirapuera: 11200, Morumbi: 8900, "Pátio Paulista": 7300 },
  { month: "Out", Eldorado: 14800, Ibirapuera: 11800, Morumbi: 9100, "Pátio Paulista": 7500 },
  { month: "Nov", Eldorado: 15200, Ibirapuera: 12100, Morumbi: 9000, "Pátio Paulista": 7400 },
  { month: "Dez", Eldorado: 15780, Ibirapuera: 12450, Morumbi: 9230, "Pátio Paulista": 7650 },
];

const chartConfig = {
  revenue: { label: "Receita", color: "hsl(var(--primary))" },
  Eldorado: { label: "Eldorado", color: "hsl(var(--chart-1))" },
  Ibirapuera: { label: "Ibirapuera", color: "hsl(var(--chart-2))" },
  Morumbi: { label: "Morumbi", color: "hsl(var(--chart-3))" },
  "Pátio Paulista": { label: "Pátio Paulista", color: "hsl(var(--chart-4))" },
};

export function SalesUnitReport() {
  const [selectedPdv, setSelectedPdv] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const filteredData = selectedPdv === "all" 
    ? salesByPdv 
    : salesByPdv.filter(p => p.pdv.toLowerCase().includes(pdvList.find(pdv => pdv.id === selectedPdv)?.name.split(" ").pop()?.toLowerCase() || ""));

  const totals = filteredData.reduce(
    (acc, curr) => ({
      revenue: acc.revenue + curr.revenue,
      transactions: acc.transactions + curr.transactions,
      avgTicket: 0,
    }),
    { revenue: 0, transactions: 0, avgTicket: 0 }
  );
  totals.avgTicket = totals.transactions > 0 ? totals.revenue / totals.transactions : 0;

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
              {totals.revenue.toLocaleString("pt-BR", {
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
              {totals.transactions.toLocaleString("pt-BR")}
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
              {totals.avgTicket.toLocaleString("pt-BR", {
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
            <div className="text-2xl font-bold">{filteredData.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{formatPeriod()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
        {/* Bar Chart - Revenue by PDV */}
        <Card>
          <CardHeader>
            <CardTitle>Receita por PDV</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={salesByPdv} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="pdv" width={100} />
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
          <CardHeader>
            <CardTitle>Evolução por Período</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
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
                <Line type="monotone" dataKey="Eldorado" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Ibirapuera" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Morumbi" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Pátio Paulista" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Unidade</CardTitle>
        </CardHeader>
        <CardContent>
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
              {salesByPdv.map((row) => (
                <TableRow key={row.pdv}>
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
    </div>
  );
}
