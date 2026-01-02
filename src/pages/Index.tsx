import { useState, useEffect, useMemo, lazy, Suspense, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle, 
  Loader2,
  Upload,
  Building2,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { useOrganizations } from "@/hooks/useOrganizations";
import { usePDVs } from "@/hooks/usePDVs";
import { useSlotsData } from "@/hooks/useSlotsData";
import { useStockHistory } from "@/hooks/useStockHistory";
import { usePreferences } from "@/hooks/usePreferences";
import { formatCurrency } from "@/lib/utils";
import { calculateTrend } from "@/lib/trendUtils";
import { getStockByBrand, getLowStockItems } from "@/lib/dashboardUtils";
import { getDateRangeFromPeriod, type DateRange } from "@/lib/utils/date-presets";
import { PDVFilter } from "@/components/ui/PDVFilter";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

// Componentes leves carregados diretamente
import { DateRangeFilter } from "@/components/dashboard/DateRangeFilter";
import { KPICard } from "@/components/dashboard/KPICard";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { StockAlertsTable } from "@/components/dashboard/StockAlertsTable";
import { ChartSkeleton } from "@/components/dashboard/ChartSkeleton";

// Lazy load dos charts pesados (usam recharts)
const SalesByDayChart = lazy(() => import("@/components/dashboard/SalesByDayChart").then(m => ({ default: m.SalesByDayChart })));
const SalesHeatmapChart = lazy(() => import("@/components/dashboard/SalesHeatmapChart").then(m => ({ default: m.SalesHeatmapChart })));
const TopProductsChart = lazy(() => import("@/components/dashboard/TopProductsChart").then(m => ({ default: m.TopProductsChart })));
const StockByBrandChart = lazy(() => import("@/components/dashboard/StockByBrandChart").then(m => ({ default: m.StockByBrandChart })));
const StockHistoryChart = lazy(() => import("@/components/dashboard/StockHistoryChart").then(m => ({ default: m.StockHistoryChart })));

export default function Index() {
  const navigate = useNavigate();
  const { preferences, isLoading: isLoadingPreferences } = usePreferences();
  const { organizations, isSuperAdmin, refetch: refetchOrgs, isFetching: isRefetchingOrgs } = useOrganizations();
  
  const [dateRange, setDateRange] = useState<DateRange>(() => getDateRangeFromPeriod("30days"));
  const [selectedPdvId, setSelectedPdvId] = useState<string>("all");
  const [pdvWasAutoApplied, setPdvWasAutoApplied] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("all");
  const [prefsInitialized, setPrefsInitialized] = useState(false);
  
  // Fetch PDVs filtered by selected organization (for super admins)
  const { pdvs = [], isLoading: pdvsLoading } = usePDVs({ 
    organizationId: isSuperAdmin ? selectedOrgId : undefined 
  });
  
  // Initialize from preferences once they load
  useEffect(() => {
    if (!prefsInitialized && preferences && !isLoadingPreferences && !pdvsLoading) {
      setDateRange(getDateRangeFromPeriod(preferences.default_period));
      
      if (preferences.default_pdv) {
        const pdvExists = pdvs.some(p => p.id === preferences.default_pdv);
        if (pdvExists) {
          setSelectedPdvId(preferences.default_pdv);
          setPdvWasAutoApplied(true);
        }
      }
      setPrefsInitialized(true);
    }
  }, [preferences, prefsInitialized, isLoadingPreferences, pdvs, pdvsLoading]);
  
  const handlePdvChange = (value: string) => {
    setSelectedPdvId(value);
    setPdvWasAutoApplied(false);
  };
  
  // Reset PDV when organization changes
  const handleOrgChange = (value: string) => {
    setSelectedOrgId(value);
    setSelectedPdvId("all");
    setPdvWasAutoApplied(false);
  };
  
  const isMobile = useIsMobile();
  
  const { data, isLoading, isFetching, refetch } = useDashboard({ 
    selectedOrganizationId: selectedOrgId,
    selectedPdvId: selectedPdvId,
    dateRange: { from: dateRange.from, to: dateRange.to }
  });
  const { data: slotsData, refetch: refetchSlots } = useSlotsData({ pdvId: selectedPdvId !== 'all' ? selectedPdvId : undefined });
  const { data: stockHistory, refetch: refetchStockHistory } = useStockHistory({ days: 90, organizationId: selectedOrgId, pdvId: selectedPdvId !== 'all' ? selectedPdvId : undefined });

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    await Promise.all([refetch(), refetchSlots(), refetchStockHistory()]);
    toast.success("Dashboard atualizado!");
  }, [refetch, refetchSlots, refetchStockHistory]);

  // Process stock data with memoization
  const stockByBrand = useMemo(() => 
    slotsData 
      ? getStockByBrand(slotsData.filter(s => s.isActive).map(s => ({ brand: s.brand, quantity: s.quantity }))) 
      : [],
    [slotsData]
  );
  
  // Calculate sales by product for low stock items using topProductsChart
  const salesByProduct = useMemo(() => {
    const map = new Map<string, number>();
    data?.topProductsChart?.forEach(p => map.set(p.name, p.count));
    return map;
  }, [data?.topProductsChart]);
  
  // Get low stock items with memoization
  const lowStockItems = useMemo(() => 
    slotsData 
      ? getLowStockItems(
          slotsData.filter(s => s.isActive).map(s => ({
            slotNumber: s.slot,
            productName: s.productName,
            brand: s.brand,
            quantity: s.quantity,
            pdvName: s.pdvName,
          })),
          salesByProduct,
          1
        ) 
      : [],
    [slotsData, salesByProduct]
  );

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

  const dashboardContent = (
    <div data-testid="dashboard-page" className="space-y-4 md:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Visão geral do desempenho das suas máquinas
            </p>
          </div>
        </div>

        {/* Filters Bar */}
        <div data-testid="dashboard-filters" className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <DateRangeFilter
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          
          {/* Organization Filter - Super Admin only */}
          {isSuperAdmin && (
            <div className="flex items-center gap-1">
              <Select value={selectedOrgId} onValueChange={handleOrgChange}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
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
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => refetchOrgs()}
                disabled={isRefetchingOrgs}
                title="Atualizar lista"
              >
                <RefreshCw className={`h-4 w-4 ${isRefetchingOrgs ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          )}
          
          <PDVFilter
            value={selectedPdvId}
            onChange={handlePdvChange}
            pdvs={pdvs}
            showAutoAppliedBadge={pdvWasAutoApplied}
          />
        </div>

        {/* Super Admin Consolidated View */}
        {isSuperAdmin && globalMetrics && (
          <Card data-testid="global-metrics-card" className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="px-4 md:px-6 pt-4 md:pt-6 pb-3">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Building2 className="h-5 w-5 text-primary" />
                Visão Consolidada
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!hasData && (
          <Card data-testid="dashboard-empty-state">
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

        {/* KPI Cards - 2 columns on mobile, 4 on desktop */}
        <div data-testid="kpi-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
          <KPICard
            testId="kpi-revenue"
            title="Receita Total"
            value={formatCurrency(kpis.totalRevenue)}
            icon={DollarSign}
            trend={revenueTrend}
            variant="success"
          />
          <KPICard
            testId="kpi-transactions"
            title="Transações"
            value={kpis.transactions.toLocaleString("pt-BR")}
            icon={ShoppingCart}
            trend={transactionsTrend}
          />
          <KPICard
            testId="kpi-avg-ticket"
            title="Ticket Médio"
            value={formatCurrency(kpis.avgTicket)}
            icon={TrendingUp}
          />
          <KPICard
            testId="kpi-critical-stock"
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
          <div data-testid="charts-section">
            {/* Row 1: Sales by Day + Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
              <Suspense fallback={<ChartSkeleton />}>
                <SalesByDayChart data={data?.salesByDay || []} />
              </Suspense>
              <Suspense fallback={<ChartSkeleton />}>
                <SalesHeatmapChart data={data?.salesByHourAndDay || []} />
              </Suspense>
            </div>

            {/* Row 2: Top Products + Stock by Brand */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
              <Suspense fallback={<ChartSkeleton />}>
                <TopProductsChart data={data?.topProductsChart || []} />
              </Suspense>
              <Suspense fallback={<ChartSkeleton />}>
                <StockByBrandChart data={stockByBrand} />
              </Suspense>
            </div>

            {/* Stock History Chart */}
            {stockHistory && stockHistory.chartData.length > 0 && (
              <Suspense fallback={<ChartSkeleton />}>
                <StockHistoryChart 
                  data={stockHistory.chartData} 
                  brands={stockHistory.brands} 
                />
              </Suspense>
            )}

            {/* Stock Alerts Table */}
            <StockAlertsTable data={lowStockItems} />
          </div>
        )}
    </div>
  );

  return (
    <AppLayout>
      {isMobile ? (
        <PullToRefresh onRefresh={handleRefresh} isRefreshing={isFetching}>
          {dashboardContent}
        </PullToRefresh>
      ) : (
        dashboardContent
      )}
    </AppLayout>
  );
}
