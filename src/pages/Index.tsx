import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { DollarSign, ShoppingCart, TrendingUp, MapPin } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

// Mock KPIs
const mockKPIs = [
  { title: "Receita Total", value: "R$ 45.231,89", change: "+12.5%", icon: DollarSign },
  { title: "Transações", value: "1.234", change: "+8.2%", icon: ShoppingCart },
  { title: "Ticket Médio", value: "R$ 36,67", change: "+3.1%", icon: TrendingUp },
  { title: "PDVs Ativos", value: "8", change: "0", icon: MapPin },
];

// Mock data para gráficos
const revenueByMonth = [
  { month: "Jul", revenue: 28500 },
  { month: "Ago", revenue: 32100 },
  { month: "Set", revenue: 29800 },
  { month: "Out", revenue: 35200 },
  { month: "Nov", revenue: 38900 },
  { month: "Dez", revenue: 45231 },
];

const salesByPdv = [
  { pdv: "Ibirapuera", revenue: 12450 },
  { pdv: "Morumbi", revenue: 9230 },
  { pdv: "Eldorado", revenue: 15780 },
  { pdv: "Pátio Paulista", revenue: 7650 },
];

const paymentMethods = [
  { method: "Pix", value: 45, fill: "hsl(var(--chart-1))" },
  { method: "Crédito", value: 35, fill: "hsl(var(--chart-2))" },
  { method: "Débito", value: 20, fill: "hsl(var(--chart-3))" },
];

const stockByPdv = [
  { pdv: "Ibirapuera", units: 420 },
  { pdv: "Morumbi", units: 380 },
  { pdv: "Eldorado", units: 510 },
  { pdv: "Pátio Paulista", units: 290 },
];

const topProducts = [
  { product: "Capinha iPhone 14", quantity: 142 },
  { product: "Carregador USB-C", quantity: 98 },
  { product: "Fone Bluetooth", quantity: 87 },
  { product: "Power Bank", quantity: 76 },
  { product: "Película Samsung", quantity: 65 },
  { product: "Cabo Lightning", quantity: 58 },
  { product: "Suporte Veicular", quantity: 45 },
  { product: "Caixa de Som", quantity: 38 },
];

const chartConfigRevenue = {
  revenue: { label: "Receita", color: "hsl(var(--primary))" },
};

const chartConfigSales = {
  revenue: { label: "Receita", color: "hsl(var(--primary))" },
};

const chartConfigStock = {
  units: { label: "Unidades", color: "hsl(var(--chart-2))" },
};

const chartConfigProducts = {
  quantity: { label: "Quantidade", color: "hsl(var(--chart-3))" },
};

const chartConfigPayment = {
  value: { label: "Percentual" },
  pix: { label: "Pix", color: "hsl(var(--chart-1))" },
  credito: { label: "Crédito", color: "hsl(var(--chart-2))" },
  debito: { label: "Débito", color: "hsl(var(--chart-3))" },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function Index() {
  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Visão geral do desempenho das suas máquinas
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {mockKPIs.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 md:px-6 pt-4 md:pt-6">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                    {kpi.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
                  <div className="text-lg md:text-2xl font-bold text-foreground">{kpi.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="text-primary">{kpi.change}</span> vs mês anterior
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Row 1: Revenue + Sales by PDV */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Revenue by Period */}
          <Card>
            <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
              <CardTitle className="text-base md:text-lg">Receita por Período</CardTitle>
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
              <ChartContainer config={chartConfigRevenue} className="h-[250px] w-full">
                <AreaChart data={revenueByMonth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />}
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

          {/* Sales by PDV */}
          <Card>
            <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
              <CardTitle className="text-base md:text-lg">Vendas por PDV</CardTitle>
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
              <ChartContainer config={chartConfigSales} className="h-[250px] w-full">
                <BarChart data={salesByPdv} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="pdv" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Payment Methods + Stock by PDV */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Payment Methods */}
          <Card>
            <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
              <CardTitle className="text-base md:text-lg">Métodos de Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
              <ChartContainer config={chartConfigPayment} className="h-[250px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent formatter={(value) => `${value}%`} />} />
                  <Pie
                    data={paymentMethods}
                    dataKey="value"
                    nameKey="method"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {paymentMethods.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartLegend
                    content={<ChartLegendContent />}
                    payload={paymentMethods.map((entry) => ({
                      value: entry.method,
                      type: "circle",
                      color: entry.fill,
                    }))}
                  />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Stock by PDV */}
          <Card>
            <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
              <CardTitle className="text-base md:text-lg">Estoque por PDV</CardTitle>
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
              <ChartContainer config={chartConfigStock} className="h-[250px] w-full">
                <BarChart data={stockByPdv} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="pdv" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(value) => `${value} unidades`} />}
                  />
                  <Bar dataKey="units" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Row 3: Top Products */}
        <Card>
          <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
            <CardTitle className="text-base md:text-lg">Produtos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
            <ChartContainer config={chartConfigProducts} className="h-[300px] w-full">
              <BarChart data={topProducts} layout="vertical" margin={{ top: 10, right: 30, left: 100, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis
                  type="category"
                  dataKey="product"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  width={90}
                />
                <ChartTooltip
                  content={<ChartTooltipContent formatter={(value) => `${value} vendas`} />}
                />
                <Bar dataKey="quantity" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
