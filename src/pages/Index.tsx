import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  MapPin, 
  AlertTriangle, 
  XCircle, 
  Clock,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Package,
  Activity,
  FileSpreadsheet,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid } from "recharts";
import { 
  dashboardKPIs, 
  revenueByMonth, 
  salesByPdv, 
  paymentMethods, 
  stockByPdv, 
  topProducts,
  stockAlerts,
  recentUploads,
  formatCurrency 
} from "@/lib/mock-data";

const mockKPIs = [
  { title: "Receita Total", value: formatCurrency(dashboardKPIs.totalRevenue), change: `+${dashboardKPIs.revenueChange}%`, icon: DollarSign },
  { title: "Transações", value: dashboardKPIs.transactions.toLocaleString("pt-BR"), change: `+${dashboardKPIs.transactionsChange}%`, icon: ShoppingCart },
  { title: "Ticket Médio", value: formatCurrency(dashboardKPIs.avgTicket), change: `+${dashboardKPIs.avgTicketChange}%`, icon: TrendingUp },
  { title: "PDVs Ativos", value: dashboardKPIs.activePdvs.toString(), change: "0", icon: MapPin },
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

const reportShortcuts = [
  { label: "Vendas por Unidade", icon: BarChart3, tab: "unit" },
  { label: "Vendas Mensal", icon: CalendarDays, tab: "monthly" },
  { label: "Análise de Produtos", icon: Package, tab: "products" },
  { label: "Saúde do Estoque", icon: Activity, tab: "stock" },
];

export default function Index() {
  const navigate = useNavigate();

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

        {/* Alerts + Quick Access Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Stock Alerts Card */}
          <Card>
            <CardHeader className="px-4 md:px-6 pt-4 md:pt-6 pb-3">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Alertas de Estoque
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4 md:pb-6 space-y-3">
              <div className="flex items-center gap-3">
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-foreground">{stockAlerts.rupture} produto em ruptura</span>
              </div>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-foreground">{stockAlerts.lowStock} produtos com estoque baixo</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{stockAlerts.stagnant} produtos parados (+30 dias)</span>
              </div>
              <Button 
                variant="link" 
                className="p-0 h-auto text-primary" 
                onClick={() => navigate('/reports?tab=stock')}
              >
                Ver relatório completo <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>

          {/* Quick Access Card */}
          <Card>
            <CardHeader className="px-4 md:px-6 pt-4 md:pt-6 pb-3">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Atalhos Rápidos
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
              <div className="grid grid-cols-2 gap-2">
                {reportShortcuts.map((shortcut) => {
                  const Icon = shortcut.icon;
                  return (
                    <Button
                      key={shortcut.tab}
                      variant="outline"
                      className="justify-start gap-2 h-auto py-3"
                      onClick={() => navigate(`/reports?tab=${shortcut.tab}`)}
                    >
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="text-sm">{shortcut.label}</span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Uploads */}
        <Card>
          <CardHeader className="px-4 md:px-6 pt-4 md:pt-6 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Últimos Uploads
              </CardTitle>
              <Button 
                variant="link" 
                className="p-0 h-auto text-primary"
                onClick={() => navigate('/uploads')}
              >
                Ver todos <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {recentUploads.map((upload) => (
                <Card 
                  key={upload.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/uploads/${upload.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant={upload.type === "sales" ? "default" : "secondary"}>
                        {upload.type === "sales" ? "Vendas" : "Estoque"}
                      </Badge>
                      {upload.status === "processed" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                      )}
                    </div>
                    <p className="font-medium text-sm text-foreground">{upload.pdv}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(upload.date).toLocaleDateString("pt-BR")} • {upload.records} registros
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

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
