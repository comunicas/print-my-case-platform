import { useMemo, lazy, Suspense, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useActiveOrg } from "@/contexts/ActiveOrgContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle, 
  Loader2,
  Upload,
  Building2,
  FileSpreadsheet,
  ChevronDown,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboard } from "@/hooks/useDashboard";
import { useDRE } from "@/hooks/useDRE";
import { useDashboardDataRange } from "@/hooks/useDashboardDataRange";
import { usePDVs } from "@/hooks/usePDVs";
import { useSlotsData } from "@/hooks/useSlotsData";
import { useDefaultPdvPreference } from "@/hooks/useDefaultPdvPreference";
import { usePreferences } from "@/hooks/usePreferences";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";
import { formatCurrency } from "@/lib/utils";
import { calculateTrend } from "@/lib/trendUtils";
import { getLowStockItems } from "@/lib/dashboardUtils";
import { getDateRangeFromPeriod, type DateRange } from "@/lib/utils/date-presets";
import { PDVFilter } from "@/components/ui/PDVFilter";
import { FilterBar } from "@/components/ui/FilterBar";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

// Componentes leves carregados diretamente
import { DateRangeFilter } from "@/components/dashboard/DateRangeFilter";
import { KPICard } from "@/components/dashboard/KPICard";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { StockAlertsTable } from "@/components/dashboard/StockAlertsTable";
import { ChartSkeleton } from "@/components/dashboard/ChartSkeleton";
import { LossAnalysisCard } from "@/components/dashboard/LossAnalysisCard";
import { FinancialSummaryCard } from "@/components/dashboard/FinancialSummaryCard";

// Lazy load dos charts pesados (usam recharts)
const SalesByDayChart = lazy(() => import("@/components/dashboard/SalesByDayChart").then(m => ({ default: m.SalesByDayChart })));
const SalesHeatmapChart = lazy(() => import("@/components/dashboard/SalesHeatmapChart").then(m => ({ default: m.SalesHeatmapChart })));
const TopProductsChart = lazy(() => import("@/components/dashboard/TopProductsChart").then(m => ({ default: m.TopProductsChart })));
const StockByBrandChart = lazy(() => import("@/components/dashboard/StockByBrandChart").then(m => ({ default: m.StockByBrandChart })));
const StockHistoryChart = lazy(() => import("@/components/dashboard/StockHistoryChart").then(m => ({ default: m.StockHistoryChart })));
const LossesByDayChart = lazy(() => import("@/components/dashboard/LossesByDayChart").then(m => ({ default: m.LossesByDayChart })));

// ── Constants ──────────────────────────────────────────────────────────────────

const DEFAULT_KPIS = {
  totalRevenue: 0,
  grossRevenue: 0,
  totalRefunds: 0,
  refundedTransactions: 0,
  transactions: 0,
  avgTicket: 0,
  activePdvs: 0,
  previousRefunds: 0,
  totalCancellations: 0,
  cancelledTransactions: 0,
  previousCancellationsTotal: 0,
  previousRevenue: 0,
  previousTransactions: 0,
  previousAvgTicket: 0,
};

const dateRangeSerializers = {
  serialize: (range: DateRange) =>
    JSON.stringify({ from: range.from.toISOString(), to: range.to.toISOString() }),
  deserialize: (raw: string): DateRange => {
    const parsed = JSON.parse(raw);
    const from = new Date(parsed.from);
    const to = new Date(parsed.to);
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      throw new Error("Invalid dates");
    }
    return { from, to };
  },
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function Index() {
  const navigate = useNavigate();
  const { preferences } = usePreferences();
  const { activeOrgId, isAllOrgs } = useActiveOrg();
  
  const [dateRange, setDateRange, clearDateRange] = useLocalStorageState<DateRange>(
    'dashboard-date-range',
    () => getDateRangeFromPeriod("30days"),
    dateRangeSerializers,
  );

  // When "all" is selected, pass "all" to queries; otherwise pass the org UUID
  const effectiveOrgId = isAllOrgs ? "all" : (activeOrgId ?? undefined);
  
  const { pdvs = [], isLoading: pdvsLoading } = usePDVs({ 
    organizationId: effectiveOrgId
  });

  const { 
    selectedPdvId, 
    setSelectedPdvId: handlePdvChange, 
    wasAutoApplied: pdvWasAutoApplied 
  } = useDefaultPdvPreference({ pdvs, isLoading: pdvsLoading });
  const [consolidatedOpen, setConsolidatedOpen] = useLocalStorageState('dashboard-consolidated-open', true);
  
  const isMobile = useIsMobile();

  // Derived: convert "all" to undefined for queries
  const effectivePdvId = selectedPdvId !== 'all' ? selectedPdvId : undefined;
  
  const { data, isLoading, isFetching, refetch } = useDashboard({ 
    selectedOrganizationId: effectiveOrgId,
    selectedPdvId: selectedPdvId,
    dateRange: { from: dateRange.from, to: dateRange.to }
  });
  const { dataRange: dashboardDataRange } = useDashboardDataRange({
    selectedOrganizationId: effectiveOrgId,
    selectedPdvId: selectedPdvId,
  });
  const { data: slotsData, refetch: refetchSlots } = useSlotsData({ pdvId: effectivePdvId });

  // DRE data for financial indices (current month)
  const { dre, isLoading: dreLoading } = useDRE({
    referenceMonth: new Date(),
    pdvId: effectivePdvId,
  });

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    await Promise.all([refetch(), refetchSlots()]);
    toast.success("Dashboard atualizado!");
  }, [refetch, refetchSlots]);

  // Calculate sales by product for low stock items using topProductsChart
  const salesByProduct = useMemo(() => {
    const map = new Map<string, number>();
    data?.topProductsChart?.forEach(p => map.set(p.name, p.count));
    return map;
  }, [data?.topProductsChart]);
  
  // Get low stock items with memoization
  const lowStockItems = useMemo(() => {
    if (!slotsData) return [];
    return getLowStockItems(
      slotsData.filter(s => s.isActive).map(s => ({
        slotNumber: s.slot,
        productName: s.productName,
        brand: s.brand,
        quantity: s.quantity,
        pdvName: s.pdvName,
      })),
      salesByProduct,
      1
    );
  }, [slotsData, salesByProduct]);

  // ── Derived data (always computed, never after early return) ────────────────

  const kpis = data?.kpis || DEFAULT_KPIS;
  const globalMetrics = data?.globalMetrics;
  const hasData = data?.hasData || false;

  const totalLosses = kpis.totalCancellations + kpis.totalRefunds;
  const previousLosses = kpis.previousCancellationsTotal + kpis.previousRefunds;
  const lossTransactions = kpis.cancelledTransactions + kpis.refundedTransactions;

  const trends = useMemo(() => ({
    revenue: calculateTrend(kpis.totalRevenue, kpis.previousRevenue, dateRange.from, dateRange.to),
    transactions: calculateTrend(kpis.transactions, kpis.previousTransactions, dateRange.from, dateRange.to),
    losses: calculateTrend(totalLosses, previousLosses, dateRange.from, dateRange.to),
    avgTicket: calculateTrend(kpis.avgTicket, kpis.previousAvgTicket, dateRange.from, dateRange.to),
  }), [kpis, totalLosses, previousLosses, dateRange.from, dateRange.to]);

  // Financial indices
  const margemOperacional = dre.receitaLiquida > 0
    ? (dre.resultadoOperacional / dre.receitaLiquida) * 100
    : 0;
  const custoTotal = dre.cmv + dre.taxasStone + dre.despesasFixas;
  const activePdvCount = kpis.activePdvs || 1;
  const custoPorMaquina = custoTotal / activePdvCount;
  const taxaPerda = kpis.grossRevenue > 0
    ? (totalLosses / kpis.grossRevenue) * 100
    : 0;

  // ── Loading state ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  const dashboardContent = (
    <div data-testid="dashboard-page" className="space-y-4 md:space-y-6">
        {/* Super Admin Consolidated View - Collapsible, before header */}
        {globalMetrics && (
          <Collapsible open={consolidatedOpen} onOpenChange={setConsolidatedOpen}>
            <Card data-testid="global-metrics-card" className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
              <CollapsibleTrigger asChild>
                <CardHeader className="px-4 md:px-6 pt-4 md:pt-6 pb-3 cursor-pointer hover:bg-primary/5 transition-colors rounded-t-lg">
                  <CardTitle className="flex items-center justify-between text-base md:text-lg">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      Visão Consolidada
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${consolidatedOpen ? 'rotate-180' : ''}`} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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
                    <div className="text-center md:text-left">
                      <p className="text-xl md:text-2xl font-bold text-foreground">{formatCurrency(globalMetrics.avgTicketGlobal)}</p>
                      <p className="text-xs md:text-sm text-muted-foreground">Ticket Médio Global</p>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

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
        <FilterBar>
          <DateRangeFilter
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            dataRange={dashboardDataRange}
            onReset={() => {
              clearDateRange();
              if (preferences?.default_period) {
                setDateRange(getDateRangeFromPeriod(preferences.default_period));
              }
            }}
          />
          
          <PDVFilter
            value={selectedPdvId}
            onChange={handlePdvChange}
            pdvs={pdvs}
            showAutoAppliedBadge={pdvWasAutoApplied}
          />
        </FilterBar>

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

        {/* KPI Cards */}
        <div data-testid="kpi-grid" className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 md:gap-4">
          <KPICard
            testId="kpi-revenue"
            title="Receita"
            value={formatCurrency(kpis.totalRevenue)}
            icon={DollarSign}
            trend={trends.revenue}
            variant="success"
          />
          <KPICard
            testId="kpi-transactions"
            title="Transações"
            value={kpis.transactions.toLocaleString("pt-BR")}
            icon={ShoppingCart}
            trend={trends.transactions}
          />
          <KPICard
            testId="kpi-avg-ticket"
            title="Ticket Médio"
            value={formatCurrency(kpis.avgTicket)}
            icon={TrendingUp}
            trend={trends.avgTicket}
          />
          <KPICard
            testId="kpi-refunds"
            title="Reembolsos"
            value={formatCurrency(kpis.totalRefunds)}
            icon={RotateCcw}
            trend={trends.refunds}
            subtitle={kpis.refundedTransactions > 0 ? `${kpis.refundedTransactions} transações` : undefined}
            variant={kpis.totalRefunds > 0 ? "danger" : "default"}
          />
          <KPICard
            testId="kpi-cancellations"
            title="Cancelamentos"
            value={formatCurrency(kpis.totalCancellations)}
            icon={Ban}
            trend={trends.cancellations}
            subtitle={kpis.cancelledTransactions > 0 ? `${kpis.cancelledTransactions} desistências` : undefined}
            variant={kpis.totalCancellations > 0 ? "warning" : "default"}
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

        {/* Loss Analysis Card */}
        <LossAnalysisCard
          totalCancellations={kpis.totalCancellations}
          cancelledTransactions={kpis.cancelledTransactions}
          totalRefunds={kpis.totalRefunds}
          refundedTransactions={kpis.refundedTransactions}
        />

        {/* Losses by Day Chart */}
        {(kpis.totalCancellations > 0 || kpis.totalRefunds > 0) && (
          <Suspense fallback={<ChartSkeleton />}>
            <LossesByDayChart data={data?.lossesByDay || []} animationDelay={0} />
          </Suspense>
        )}

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
          <div data-testid="charts-section" className="space-y-4">
            <Suspense fallback={<ChartSkeleton />}>
              <SalesByDayChart data={data?.salesByDay || []} animationDelay={0} />
            </Suspense>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
              <Suspense fallback={<ChartSkeleton />}>
                <SalesHeatmapChart data={data?.salesByHourAndDay || []} animationDelay={100} />
              </Suspense>
              <Suspense fallback={<ChartSkeleton />}>
                <TopProductsChart data={data?.topProductsChart || []} animationDelay={150} selectedPdvId={effectivePdvId} />
              </Suspense>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
              <Suspense fallback={<ChartSkeleton />}>
                <StockByBrandChart pdvId={effectivePdvId} animationDelay={200} />
              </Suspense>
              <Suspense fallback={<ChartSkeleton />}>
                <StockHistoryChart 
                  organizationId={effectiveOrgId}
                  pdvId={effectivePdvId}
                  animationDelay={250}
                />
              </Suspense>
            </div>

            <StockAlertsTable data={lowStockItems} animationDelay={300} selectedPdvId={effectivePdvId} />
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
