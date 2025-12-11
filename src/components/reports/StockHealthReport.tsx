import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  Download,
  AlertTriangle,
  XCircle,
  Clock,
  Package,
  TrendingUp,
  Loader2,
  PackageX,
  CheckCircle2,
} from "lucide-react";
import { useReportStockHealth } from "@/hooks/useReportStockHealth";
import { ReportEmptyState } from "./ReportEmptyState";

const chartConfig = {
  units: { label: "Unidades", color: "hsl(var(--primary))" },
};

const getHealthColor = (score: number) => {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-yellow-500";
  return "text-destructive";
};

const getHealthLabel = (score: number) => {
  if (score >= 80) return "Excelente";
  if (score >= 60) return "Bom";
  if (score >= 40) return "Atenção";
  return "Crítico";
};

const getProgressColor = (score: number) => {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-yellow-500";
  return "bg-destructive";
};

const getAlertIcon = (type: string) => {
  switch (type) {
    case "rupture":
      return <XCircle className="h-5 w-5 text-destructive" />;
    case "low":
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case "stagnant":
      return <Clock className="h-5 w-5 text-muted-foreground" />;
    default:
      return <Package className="h-5 w-5" />;
  }
};

const getAlertBadge = (type: string) => {
  switch (type) {
    case "rupture":
      return <Badge variant="destructive">RUPTURA</Badge>;
    case "low":
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">BAIXO ESTOQUE</Badge>;
    case "stagnant":
      return <Badge variant="secondary">PARADO</Badge>;
    default:
      return null;
  }
};

const getTurnoverBadge = (status: string) => {
  switch (status) {
    case "excellent":
      return <Badge className="bg-emerald-500">Excelente</Badge>;
    case "good":
      return <Badge className="bg-blue-500">Bom</Badge>;
    case "average":
      return <Badge className="bg-yellow-500">Médio</Badge>;
    case "low":
      return <Badge variant="secondary">Baixo</Badge>;
    case "critical":
      return <Badge variant="destructive">Crítico</Badge>;
    default:
      return null;
  }
};

export function StockHealthReport() {
  const { data, isLoading } = useReportStockHealth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasData = data && data.stockByPdv.length > 0;

  if (!hasData) {
    return (
      <ReportEmptyState
        icon={PackageX}
        title="Sem dados de estoque"
        description="Faça upload de planilhas de estoque para visualizar a saúde do estoque."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-end">
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* Health Score Card */}
      <Card>
        <CardHeader>
          <CardTitle>Score de Saúde do Estoque</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <div className={`text-5xl font-bold ${getHealthColor(data.healthScore)}`}>
              {data.healthScore}/100
            </div>
            <div className={`text-lg font-medium ${getHealthColor(data.healthScore)}`}>
              {getHealthLabel(data.healthScore)}
            </div>
            <div className="w-full max-w-md">
              <Progress value={data.healthScore} className={`h-4 ${getProgressColor(data.healthScore)}`} />
            </div>
            
            {/* Segmented Progress Bar */}
            {data.totals.totalActiveSlots > 0 && (
              <div className="w-full max-w-md space-y-2">
                <div className="flex w-full h-3 rounded-full overflow-hidden bg-muted">
                  <div 
                    className="bg-emerald-500 transition-all" 
                    style={{ width: `${(data.totals.healthySlots / data.totals.totalActiveSlots) * 100}%` }}
                  />
                  <div 
                    className="bg-blue-500 transition-all" 
                    style={{ width: `${(data.totals.goodSlots / data.totals.totalActiveSlots) * 100}%` }}
                  />
                  <div 
                    className="bg-yellow-500 transition-all" 
                    style={{ width: `${(data.totals.riskSlots / data.totals.totalActiveSlots) * 100}%` }}
                  />
                  <div 
                    className="bg-destructive transition-all" 
                    style={{ width: `${(data.totals.criticalSlots / data.totals.totalActiveSlots) * 100}%` }}
                  />
                </div>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Saudável ({((data.totals.healthySlots / data.totals.totalActiveSlots) * 100).toFixed(0)}%)
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    Bom ({((data.totals.goodSlots / data.totals.totalActiveSlots) * 100).toFixed(0)}%)
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                    Risco ({((data.totals.riskSlots / data.totals.totalActiveSlots) * 100).toFixed(0)}%)
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="h-2.5 w-2.5 rounded-full bg-destructive" />
                    Crítico ({((data.totals.criticalSlots / data.totals.totalActiveSlots) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <XCircle className="h-4 w-4 text-destructive" />
                {data.totals.criticalAlerts} rupturas
              </span>
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                {data.totals.warningAlerts} alertas
              </span>
              <span className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                {data.totals.totalUnits.toLocaleString("pt-BR")} unidades
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Distribution Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Distribuição dos Slots por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex flex-col items-center p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <XCircle className="h-6 w-6 text-destructive mb-2" />
              <span className="text-2xl font-bold text-destructive">{data.totals.criticalSlots}</span>
              <span className="text-xs text-muted-foreground text-center">Crítico (0 un.)</span>
            </div>
            
            <div className="flex flex-col items-center p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <AlertTriangle className="h-6 w-6 text-yellow-500 mb-2" />
              <span className="text-2xl font-bold text-yellow-500">{data.totals.riskSlots}</span>
              <span className="text-xs text-muted-foreground text-center">Risco (1 un.)</span>
            </div>
            
            <div className="flex flex-col items-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Package className="h-6 w-6 text-blue-500 mb-2" />
              <span className="text-2xl font-bold text-blue-500">{data.totals.goodSlots}</span>
              <span className="text-xs text-muted-foreground text-center">Bom (2 un.)</span>
            </div>
            
            <div className="flex flex-col items-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="h-6 w-6 text-emerald-500 mb-2" />
              <span className="text-2xl font-bold text-emerald-500">{data.totals.healthySlots}</span>
              <span className="text-xs text-muted-foreground text-center">Saudável (3+ un.)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total em Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.totals.totalUnits.toLocaleString("pt-BR")} un.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Slots Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              {data.totals.totalActiveSlots}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Slots Inativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {data.totals.totalInactiveSlots}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alertas Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {data.alerts.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {data.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Alertas Ativos ({data.alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {data.alerts.map((alert, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 border rounded-lg bg-card"
                >
                  {getAlertIcon(alert.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getAlertBadge(alert.type)}
                    </div>
                    <p className="font-medium text-sm truncate">{alert.product}</p>
                    <p className="text-sm text-muted-foreground">
                      {alert.pdv} • {alert.slot}
                    </p>
                    <p className="text-sm mt-1">
                      {alert.type === "stagnant"
                        ? `Parado há ${alert.daysStagnant} dias • ${alert.units} un.`
                        : `${alert.units} unidades`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts and Tables Row */}
      <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
        {/* Bar Chart - Stock by PDV */}
        <Card>
          <CardHeader>
            <CardTitle>Estoque por PDV</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={data.stockByPdv}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="pdv" />
                <YAxis />
                <ChartTooltip
                  content={
                    <ChartTooltipContent formatter={(value) => `${value} unidades`} />
                  }
                />
                <Bar dataKey="units" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Turnover Ranking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Giro de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.turnoverRanking.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Giro/Mês</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.turnoverRanking.map((row) => (
                    <TableRow key={row.product}>
                      <TableCell className="font-medium">{row.product}</TableCell>
                      <TableCell className="text-right">{row.turnover.toFixed(1)}x</TableCell>
                      <TableCell className="text-right">{getTurnoverBadge(row.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                Sem dados de giro
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inactive Slots Table */}
      {data.inactiveSlots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Slots Inativos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PDV</TableHead>
                  <TableHead>Slot</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Desde</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.inactiveSlots.map((slot, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{slot.pdv}</TableCell>
                    <TableCell>{slot.slot}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{slot.reason}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{slot.since}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
