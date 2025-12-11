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
  Loader2,
  Upload
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid } from "recharts";
import { useDashboard } from "@/hooks/useDashboard";
import { formatCurrency } from "@/lib/utils";

// Helper para truncar labels longos nos gráficos
function truncateLabel(label: string, maxLength: number = 12): string {
  return label.length > maxLength ? `${label.substring(0, maxLength)}...` : label;
}

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
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  const kpis = data?.kpis || {
    totalRevenue: 0,
    transactions: 0,
    avgTicket: 0,
    activePdvs: 0,
    revenueChange: 0,
    transactionsChange: 0,
  };

  const kpiCards = [
    { 
      title: "Receita Total", 
      value: formatCurrency(kpis.totalRevenue), 
      change: `${kpis.revenueChange >= 0 ? '+' : ''}${kpis.revenueChange.toFixed(1)}%`, 
      icon: DollarSign 
    },
    { 
      title: "Transações", 
      value: kpis.transactions.toLocaleString("pt-BR"), 
      change: `${kpis.transactionsChange >= 0 ? '+' : ''}${kpis.transactionsChange.toFixed(1)}%`, 
      icon: ShoppingCart 
    },
    { 
      title: "Ticket Médio", 
      value: formatCurrency(kpis.avgTicket), 
      change: "", 
      icon: TrendingUp 
    },
    { 
      title: "PDVs Ativos", 
      value: kpis.activePdvs.toString(), 
      change: "", 
      icon: MapPin 
    },
  ];

  const stockAlerts = data?.stockAlerts || { rupture: 0, lowStock: 0, stagnant: 0 };
  const recentUploads = data?.recentUploads || [];
  const revenueByMonth = data?.revenueByMonth || [];
  const salesByPdv = data?.salesByPdv || [];
  const paymentMethods = data?.paymentMethods || [];
  const stockByPdv = data?.stockByPdv || [];
  const topProducts = data?.topProducts || [];
  const hasData = data?.hasData || false;

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

        {/* Empty State */}
        {!hasData && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Sem dados ainda</h3>
              <p className="text-muted-foreground text-center mb-4 max-w-md">
                Faça o upload das suas planilhas de vendas e estoque para ver os dados aqui.
              </p>
              <Button onClick={() => navigate('/uploads')}>
                <Upload className="h-4 w-4 mr-2" />
                Fazer Upload
              </Button>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {kpiCards.map((kpi) => {
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
                  {kpi.change && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className={kpi.change.startsWith('-') ? "text-destructive" : "text-primary"}>{kpi.change}</span> vs mês anterior
                    </p>
                  )}
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
                <span className="text-sm text-foreground">{stockAlerts.rupture} produto{stockAlerts.rupture !== 1 ? 's' : ''} em ruptura</span>
              </div>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-foreground">{stockAlerts.lowStock} produto{stockAlerts.lowStock !== 1 ? 's' : ''} com estoque baixo</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Produtos parados (+30 dias): N/D</span>
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
            {recentUploads.length > 0 ? (
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
                        {upload.status === "ready" ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : upload.status === "error" ? (
                          <XCircle className="h-4 w-4 text-destructive" />
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
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">
                Nenhum upload realizado ainda
              </p>
            )}
          </CardContent>
        </Card>

        {/* Charts - Only show if there's data */}
        {hasData && (
          <>
            {/* Row 1: Revenue + Sales by PDV */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Revenue by Period */}
              <Card>
                <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
                  <CardTitle className="text-base md:text-lg">Receita por Período</CardTitle>
                </CardHeader>
                <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
                  {revenueByMonth.length > 0 ? (
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
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      Nenhum dado de receita disponível
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sales by PDV */}
              <Card>
                <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
                  <CardTitle className="text-base md:text-lg">Vendas por PDV</CardTitle>
                </CardHeader>
                <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
                  {salesByPdv.length > 0 ? (
                    <ChartContainer config={chartConfigSales} className="h-[250px] w-full">
                      <BarChart data={salesByPdv} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="pdv" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => truncateLabel(v)} />
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
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      Nenhum dado de vendas disponível
                    </div>
                  )}
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
                  {paymentMethods.length > 0 ? (
                    <ChartContainer config={chartConfigPayment} className="h-[250px] w-full">
                      <PieChart>
                        <ChartTooltip content={<ChartTooltipContent formatter={(value, name, item) => `${value}% (${(item.payload as any)?.count || 0} vendas)`} />} />
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
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      Nenhum dado de pagamento disponível
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Stock by PDV */}
              <Card>
                <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
                  <CardTitle className="text-base md:text-lg">Estoque por PDV</CardTitle>
                </CardHeader>
                <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
                  {stockByPdv.length > 0 ? (
                    <ChartContainer config={chartConfigStock} className="h-[250px] w-full">
                      <BarChart data={stockByPdv} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="pdv" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => truncateLabel(v)} />
                        <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                        <ChartTooltip
                          content={<ChartTooltipContent formatter={(value) => `${value} unidades`} />}
                        />
                        <Bar dataKey="units" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      Nenhum dado de estoque disponível
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Row 3: Top Products */}
            {topProducts.length > 0 && (
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
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
