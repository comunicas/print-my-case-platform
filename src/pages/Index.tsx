import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, TrendingUp, MapPin } from "lucide-react";

// Mock KPIs para visualização do protótipo
const mockKPIs = [
  {
    title: "Receita Total",
    value: "R$ 45.231,89",
    change: "+12.5%",
    icon: DollarSign,
  },
  {
    title: "Transações",
    value: "1.234",
    change: "+8.2%",
    icon: ShoppingCart,
  },
  {
    title: "Ticket Médio",
    value: "R$ 36,67",
    change: "+3.1%",
    icon: TrendingUp,
  },
  {
    title: "PDVs Ativos",
    value: "8",
    change: "0",
    icon: MapPin,
  },
];

export default function Index() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do desempenho das suas máquinas
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {mockKPIs.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {kpi.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {kpi.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className="text-primary">{kpi.change}</span> vs mês
                    anterior
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Placeholder for charts */}
        <Card className="h-80">
          <CardHeader>
            <CardTitle>Receita por Período</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-56">
            <p className="text-muted-foreground">
              Gráfico será implementado na próxima fase
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
