import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle, 
  Loader2,
  Upload,
  Building2,
  FileSpreadsheet
} from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useSlotsData } from "@/hooks/useSlotsData";
import { useStockHistory } from "@/hooks/useStockHistory";
import { formatCurrency } from "@/lib/utils";
import { calculateTrend } from "@/lib/trendUtils";
import { getStockByBrand, getLowStockItems } from "@/lib/dashboardUtils";

// Dashboard Components
import { DateRangeFilter, DateRange } from "@/components/dashboard/DateRangeFilter";
import { KPICard } from "@/components/dashboard/KPICard";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { SalesByDayChart } from "@/components/dashboard/SalesByDayChart";
import { SalesHeatmapChart } from "@/components/dashboard/SalesHeatmapChart";
import { TopProductsChart } from "@/components/dashboard/TopProductsChart";
import { StockByBrandChart } from "@/components/dashboard/StockByBrandChart";
import { StockAlertsTable } from "@/components/dashboard/StockAlertsTable";
import { StockHistoryChart } from "@/components/dashboard/StockHistoryChart";

export default function Index() {
  const navigate = useNavigate();
  const [selectedOrgId, setSelectedOrgId] = useState<string>("all");
  const today = new Date();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfDay(subDays(today, 29)),
    to: endOfDay(today),
  });
  
  const { organizations, isSuperAdmin } = useOrganizations();
  const { data, isLoading } = useDashboard({ 
    selectedOrganizationId: selectedOrgId,
    dateRange: { from: dateRange.from, to: dateRange.to }
  });
  const { data: slotsData } = useSlotsData({});
  const { data: stockHistory } = useStockHistory({ days: 90, organizationId: selectedOrgId });

  // Process stock data (not dependent on sales date range)
  const stockByBrand = slotsData ? getStockByBrand(
    slotsData.filter(s => s.isActive).map(s => ({ brand: s.brand, quantity: s.quantity }))
  ) : [];
  
  // Calculate sales by product for low stock items using topProductsChart
  const salesByProduct = new Map<string, number>();
  data?.topProductsChart?.forEach(p => {
    salesByProduct.set(p.name, p.count);
  });
  
  // Get low stock items
  const lowStockItems = slotsData ? getLowStockItems(
    slotsData.filter(s => s.isActive).map(s => ({
      slotNumber: s.slot,
      productName: s.productName,
      brand: s.brand,
      quantity: s.quantity,
      pdvName: s.pdvName,
    })),
    salesByProduct,
    1
  ) : [];

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

  const globalMetrics = data?.globalMetrics;
  const hasData = data?.hasData || false;
  
  // Calculate trends
  const revenueTrend = calculateTrend(
    kpis.totalRevenue,
    kpis.totalRevenue / (1 + kpis.revenueChange / 100),
    dateRange.from,
    dateRange.to
  );
  
  const transactionsTrend = calculateTrend(
    kpis.transactions,
    kpis.transactions / (1 + kpis.transactionsChange / 100),
    dateRange.from,
    dateRange.to
  );

  // Count critical stock
  const criticalStockCount = lowStockItems.length;

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Visão geral do desempenho das suas máquinas
            </p>
          </div>
        </div>

        {/* Date Range Filter */}
        <DateRangeFilter
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        {/* Super Admin Consolidated View */}
        {isSuperAdmin && globalMetrics && (
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="px-4 md:px-6 pt-4 md:pt-6 pb-3">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Building2 className="h-5 w-5 text-primary" />
                Visão Consolidada
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center md:text-left">
                  <p className="text-xl md:text-2xl font-bold text-foreground">{globalMetrics.totalOrganizations}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Organizações</p>
                </div>
                <div className="text-center md:text-left">
                  <p className="text-xl md:text-2xl font-bold text-foreground">{globalMetrics.totalPdvsGlobal}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">PDVs Total</p>
                </div>
                <div className="text-center md:text-left">
                  <p className="text-xl md:text-2xl font-bold text-foreground">{formatCurrency(globalMetrics.totalRevenueGlobal)}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Receita Global</p>
                </div>
                <div className="text-center md:text-left">
                  <p className="text-xl md:text-2xl font-bold text-foreground">{globalMetrics.totalTransactionsGlobal.toLocaleString("pt-BR")}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Transações Global</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <Label className="text-sm font-medium">Filtrar por Organização</Label>
                <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                  <SelectTrigger className="mt-2 w-full md:w-72 bg-background">
                    <SelectValue placeholder="Todas as organizações" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as organizações</SelectItem>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

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
          <KPICard
            title="Receita Total"
            value={formatCurrency(kpis.totalRevenue)}
            icon={DollarSign}
            trend={revenueTrend}
            variant="success"
          />
          <KPICard
            title="Transações"
            value={kpis.transactions.toLocaleString("pt-BR")}
            icon={ShoppingCart}
            trend={transactionsTrend}
          />
          <KPICard
            title="Ticket Médio"
            value={formatCurrency(kpis.avgTicket)}
            icon={TrendingUp}
          />
          <KPICard
            title="Estoque Crítico"
            value={criticalStockCount.toString()}
            icon={AlertTriangle}
            subtitle="Slots com 0-1 unidades"
            variant={criticalStockCount > 0 ? "danger" : "success"}
          />
        </div>

        {/* Quick Stats */}
        {data?.quickStats && (
          <QuickStats 
            peakTimeRange={data.quickStats.peakTimeRange}
            peakTimeRangeRevenue={data.quickStats.peakTimeRangeRevenue}
            bestDay={data.quickStats.bestDay}
            bestDayRevenue={data.quickStats.bestDayRevenue}
          />
        )}

        {/* Charts - Only show if there's data */}
        {hasData && (
          <>
            {/* Row 1: Sales by Day + Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
              <SalesByDayChart data={data?.salesByDay || []} />
              <SalesHeatmapChart data={data?.salesByHourAndDay || []} />
            </div>

            {/* Row 2: Top Products + Stock by Brand */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
              <TopProductsChart data={data?.topProductsChart || []} />
              <StockByBrandChart data={stockByBrand} />
            </div>

            {/* Stock History Chart */}
            {stockHistory && stockHistory.chartData.length > 0 && (
              <StockHistoryChart 
                data={stockHistory.chartData} 
                brands={stockHistory.brands} 
              />
            )}

            {/* Stock Alerts Table */}
            <StockAlertsTable data={lowStockItems} />
          </>
        )}
      </div>
    </AppLayout>
  );
}
