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
} from "lucide-react";

// Mock data
const healthScore = 78;

const alerts = [
  {
    type: "rupture",
    product: "Capinha iPhone 14",
    slot: "Slot 05",
    pdv: "Eldorado",
    units: 0,
    severity: "critical",
  },
  {
    type: "low",
    product: "Carregador USB-C",
    slot: "Slot 12",
    pdv: "Morumbi",
    units: 3,
    severity: "warning",
  },
  {
    type: "low",
    product: "Fone Bluetooth",
    slot: "Slot 08",
    pdv: "Pátio Paulista",
    units: 2,
    severity: "warning",
  },
  {
    type: "stagnant",
    product: "Capa Galaxy S21",
    slot: "Slot 15",
    pdv: "Ibirapuera",
    units: 8,
    daysStagnant: 45,
    severity: "info",
  },
  {
    type: "stagnant",
    product: "Fone P2 Básico",
    slot: "Slot 22",
    pdv: "Morumbi",
    units: 12,
    daysStagnant: 32,
    severity: "info",
  },
];

const stockByPdv = [
  { pdv: "Eldorado", units: 510, activeSlots: 120, inactiveSlots: 5 },
  { pdv: "Ibirapuera", units: 420, activeSlots: 86, inactiveSlots: 8 },
  { pdv: "Morumbi", units: 380, activeSlots: 95, inactiveSlots: 3 },
  { pdv: "Pátio Paulista", units: 290, activeSlots: 65, inactiveSlots: 2 },
];

const turnoverRanking = [
  { product: "Capinha iPhone 14", turnover: 8.5, status: "excellent" },
  { product: "Carregador USB-C", turnover: 6.2, status: "good" },
  { product: "Fone Bluetooth", turnover: 5.8, status: "good" },
  { product: "Power Bank", turnover: 4.1, status: "average" },
  { product: "Cabo Lightning", turnover: 3.5, status: "average" },
  { product: "Película iPhone", turnover: 2.8, status: "low" },
  { product: "Capa Galaxy S21", turnover: 0.5, status: "critical" },
];

const inactiveSlots = [
  { pdv: "Ibirapuera", slot: "Slot 42", reason: "Manutenção", since: "15/11/2024" },
  { pdv: "Ibirapuera", slot: "Slot 43", reason: "Produto descontinuado", since: "01/12/2024" },
  { pdv: "Eldorado", slot: "Slot 88", reason: "Manutenção", since: "20/11/2024" },
  { pdv: "Morumbi", slot: "Slot 55", reason: "Sem produto definido", since: "10/12/2024" },
];

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
  const totalUnits = stockByPdv.reduce((acc, curr) => acc + curr.units, 0);
  const totalActiveSlots = stockByPdv.reduce((acc, curr) => acc + curr.activeSlots, 0);
  const totalInactiveSlots = stockByPdv.reduce((acc, curr) => acc + curr.inactiveSlots, 0);

  const criticalAlerts = alerts.filter((a) => a.type === "rupture").length;
  const warningAlerts = alerts.filter((a) => a.type === "low").length;

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
            <div className={`text-5xl font-bold ${getHealthColor(healthScore)}`}>
              {healthScore}/100
            </div>
            <div className={`text-lg font-medium ${getHealthColor(healthScore)}`}>
              {getHealthLabel(healthScore)}
            </div>
            <div className="w-full max-w-md">
              <Progress value={healthScore} className={`h-4 ${getProgressColor(healthScore)}`} />
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <XCircle className="h-4 w-4 text-destructive" />
                {criticalAlerts} rupturas
              </span>
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                {warningAlerts} alertas
              </span>
              <span className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                {totalUnits.toLocaleString("pt-BR")} unidades
              </span>
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
              {totalUnits.toLocaleString("pt-BR")} un.
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
              {totalActiveSlots}
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
              {totalInactiveSlots}
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
              {alerts.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Alertas Ativos ({alerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {alerts.map((alert, index) => (
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

      {/* Charts and Tables Row */}
      <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
        {/* Bar Chart - Stock by PDV */}
        <Card>
          <CardHeader>
            <CardTitle>Estoque por PDV</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={stockByPdv}>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Giro/Mês</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {turnoverRanking.map((row) => (
                  <TableRow key={row.product}>
                    <TableCell className="font-medium">{row.product}</TableCell>
                    <TableCell className="text-right">{row.turnover.toFixed(1)}x</TableCell>
                    <TableCell className="text-right">{getTurnoverBadge(row.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Inactive Slots Table */}
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
              {inactiveSlots.map((slot, index) => (
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
    </div>
  );
}
