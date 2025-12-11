import { useState } from "react";
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
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";
import { Download, TrendingUp, TrendingDown, Calendar } from "lucide-react";

// Mock data
const months = [
  { value: "2024-12", label: "Dezembro 2024" },
  { value: "2024-11", label: "Novembro 2024" },
  { value: "2024-10", label: "Outubro 2024" },
  { value: "2024-09", label: "Setembro 2024" },
];

const dailySales = Array.from({ length: 31 }, (_, i) => ({
  day: `${i + 1}`,
  revenue: Math.floor(Math.random() * 2000) + 800,
  transactions: Math.floor(Math.random() * 50) + 20,
}));

const weekdaySales = [
  { day: "Dom", revenue: 4200, transactions: 115 },
  { day: "Seg", revenue: 5800, transactions: 158 },
  { day: "Ter", revenue: 6200, transactions: 169 },
  { day: "Qua", revenue: 6500, transactions: 177 },
  { day: "Qui", revenue: 6800, transactions: 185 },
  { day: "Sex", revenue: 7200, transactions: 196 },
  { day: "Sáb", revenue: 8500, transactions: 231 },
];

const weeklySummary = [
  { week: "Semana 1 (01-07)", revenue: 8450, transactions: 230, avgTicket: 36.74 },
  { week: "Semana 2 (08-14)", revenue: 9120, transactions: 248, avgTicket: 36.77 },
  { week: "Semana 3 (15-21)", revenue: 10230, transactions: 278, avgTicket: 36.80 },
  { week: "Semana 4 (22-28)", revenue: 11680, transactions: 318, avgTicket: 36.73 },
  { week: "Semana 5 (29-31)", revenue: 5750, transactions: 160, avgTicket: 35.94 },
];

const chartConfig = {
  revenue: { label: "Receita", color: "hsl(var(--primary))" },
  transactions: { label: "Transações", color: "hsl(var(--chart-2))" },
};

export function MonthlySalesReport() {
  const [selectedMonth, setSelectedMonth] = useState("2024-12");

  const totalRevenue = dailySales.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalTransactions = dailySales.reduce((acc, curr) => acc + curr.transactions, 0);
  const avgTicket = totalRevenue / totalTransactions;

  const bestDay = dailySales.reduce((prev, curr) => (curr.revenue > prev.revenue ? curr : prev));
  const worstDay = dailySales.reduce((prev, curr) => (curr.revenue < prev.revenue ? curr : prev));

  const previousMonthRevenue = 42100;
  const variation = ((totalRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Selecione o mês" />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRevenue.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </div>
            <div className={`flex items-center gap-1 text-sm mt-1 ${variation >= 0 ? "text-emerald-500" : "text-destructive"}`}>
              {variation >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>{variation >= 0 ? "+" : ""}{variation.toFixed(1)}% vs mês anterior</span>
            </div>
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
              {avgTicket.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </div>
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
              Dia {bestDay.day}
            </div>
            <div className="text-sm text-muted-foreground">
              {bestDay.revenue.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
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
              Dia {worstDay.day}
            </div>
            <div className="text-sm text-muted-foreground">
              {worstDay.revenue.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
        {/* Area Chart - Daily Sales */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Vendas Diárias</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`} />
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
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Bar Chart - Weekday Sales */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Dia da Semana</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={weekdaySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
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
                <Bar dataKey="revenue" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Weekly Summary Table */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Semana</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                  <TableHead className="text-right">Trans.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weeklySummary.map((row) => (
                  <TableRow key={row.week}>
                    <TableCell className="font-medium text-sm">{row.week}</TableCell>
                    <TableCell className="text-right">
                      {row.revenue.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </TableCell>
                    <TableCell className="text-right">{row.transactions}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
